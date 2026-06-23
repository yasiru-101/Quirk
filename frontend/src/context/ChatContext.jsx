/**
 * @file ChatContext.jsx
 * @description Provides conversation list and real-time message delivery to the
 * chat UI. Subscribes to Socket.IO events using the existing SocketContext so no
 * second connection is opened.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import * as chatApi from '../services/chatApi';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { on } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  // activeConversationId is set when the user opens a thread
  const [activeConversationId, setActiveConversationId] = useState(null);
  // messages keyed by conversationId
  const [messageMap, setMessageMap] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  // track which conversations have older messages to load
  const hasMoreRef = useRef({});

  // ─── Load conversations ──────────────────────────────────────────────────
  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingConversations(true);
    try {
      const { data } = await chatApi.listConversations();
      setConversations(data.conversations ?? []);
    } catch {
      // silently ignore; UI will show empty state
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) refreshConversations();
  }, [isAuthenticated, refreshConversations]);

  // ─── Load message history ────────────────────────────────────────────────
  const loadMessages = useCallback(async (conversationId, before = undefined) => {
    setLoadingMessages(true);
    try {
      const { data } = await chatApi.getMessages(conversationId, { before, limit: 50 });
      const incoming = data.messages ?? [];
      hasMoreRef.current[conversationId] = incoming.length === 50;

      setMessageMap((prev) => {
        const existing = prev[conversationId] ?? [];
        // Prepend older messages (before = cursor → older page)
        const merged = before ? [...incoming, ...existing] : incoming;
        return { ...prev, [conversationId]: merged };
      });
    } catch {
      // noop
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // ─── Open a conversation ─────────────────────────────────────────────────
  const openConversation = useCallback(
    async (conversationId) => {
      setActiveConversationId(conversationId);
      if (!messageMap[conversationId]) {
        await loadMessages(conversationId);
      }
    },
    [loadMessages, messageMap]
  );

  // Load more (older) messages for the active conversation
  const loadMore = useCallback(() => {
    if (!activeConversationId) return;
    const msgs = messageMap[activeConversationId] ?? [];
    if (!msgs.length) return;
    if (!hasMoreRef.current[activeConversationId]) return;
    loadMessages(activeConversationId, msgs[0].id);
  }, [activeConversationId, loadMessages, messageMap]);

  // ─── Send a message ──────────────────────────────────────────────────────
  const sendMessage = useCallback(async (conversationId, content) => {
    const { data } = await chatApi.sendMessage(conversationId, content);
    // Optimistically append; the socket echo will be deduplicated below
    setMessageMap((prev) => {
      const existing = prev[conversationId] ?? [];
      // Avoid duplicate if socket delivers before REST resolves
      if (existing.some((m) => m.id === data.message.id)) return prev;
      return { ...prev, [conversationId]: [...existing, data.message] };
    });
    bumpConversation(conversationId, data.message);
    return data.message;
  }, []);

  // ─── Delete a message ────────────────────────────────────────────────────
  const deleteMessage = useCallback(async (conversationId, messageId) => {
    await chatApi.deleteMessage(conversationId, messageId);
    setMessageMap((prev) => {
      const msgs = (prev[conversationId] ?? []).map((m) =>
        m.id === messageId ? { ...m, content: '[deleted]', deletedAt: new Date().toISOString() } : m
      );
      return { ...prev, [conversationId]: msgs };
    });
  }, []);

  // ─── Open / create DM conversation ──────────────────────────────────────
  const openDm = useCallback(
    async (targetUserId, workspaceId) => {
      const { data } = await chatApi.getOrCreateDmConversation(targetUserId, workspaceId);
      const conv = data.conversation;
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      await openConversation(conv.id);
      return conv;
    },
    [openConversation]
  );

  // Open / create project conversation
  const openProjectConversation = useCallback(
    async (projectId) => {
      const { data } = await chatApi.getOrCreateProjectConversation(projectId);
      const conv = data.conversation;
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      await openConversation(conv.id);
      return conv;
    },
    [openConversation]
  );

  // ─── Move a conversation to the top of the list on new message ───────────
  const bumpConversation = (conversationId, latestMessage) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, latestMessage } : c
      ).sort((a, b) => {
        const at = a.latestMessage?.createdAt ?? a.createdAt;
        const bt = b.latestMessage?.createdAt ?? b.createdAt;
        return new Date(bt) - new Date(at);
      })
    );
  };

  // ─── Socket subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    // Incoming chat message from another participant
    const offMessage = on('chat:message', (message) => {
      const { conversationId } = message;
      setMessageMap((prev) => {
        const existing = prev[conversationId] ?? [];
        if (existing.some((m) => m.id === message.id)) return prev;
        return { ...prev, [conversationId]: [...existing, message] };
      });
      bumpConversation(conversationId, message);
    });

    // Soft-delete broadcast from another client
    const offDeleted = on('chat:message_deleted', ({ conversationId, messageId }) => {
      setMessageMap((prev) => {
        const msgs = (prev[conversationId] ?? []).map((m) =>
          m.id === messageId
            ? { ...m, content: '[deleted]', deletedAt: new Date().toISOString() }
            : m
        );
        return { ...prev, [conversationId]: msgs };
      });
    });

    // Latest-message previews replayed on reconnect
    const offPreviews = on('chat:previews', (previews) => {
      setMessageMap((prev) => {
        const next = { ...prev };
        previews.forEach((msg) => {
          const existing = next[msg.conversationId] ?? [];
          if (!existing.some((m) => m.id === msg.id)) {
            next[msg.conversationId] = [...existing, msg];
          }
        });
        return next;
      });
    });

    return () => {
      offMessage();
      offDeleted();
      offPreviews();
    };
  }, [on]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        loadingConversations,
        activeConversationId,
        messages: activeConversationId ? (messageMap[activeConversationId] ?? []) : [],
        loadingMessages,
        hasMore: activeConversationId ? !!hasMoreRef.current[activeConversationId] : false,
        refreshConversations,
        openConversation,
        openDm,
        openProjectConversation,
        sendMessage,
        deleteMessage,
        loadMore,
        closeConversation: () => setActiveConversationId(null),
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
