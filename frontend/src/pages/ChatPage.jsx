/**
 * @file ChatPage.jsx
 * @description Full-page chat and direct-message UI.
 *
 * Layout:
 *   Left panel: conversation list and new DM button
 *   Right panel: message thread and composer
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import ConversationList from '../components/chat/ConversationList';
import MessageThread from '../components/chat/MessageThread';
import MessageInput from '../components/chat/MessageInput';
import { useProject } from '../context/ProjectContext';

// ─── New DM modal ─────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import api from '../services/api';

function NewDmModal({ onClose, workspaceId }) {
  const { openDm } = useChat();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(null);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    api
      .get(`/workspaces/${workspaceId}/members`)
      .then(({ data }) => setUsers(data.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const filtered = users.filter(
    (m) =>
      m.user?.name?.toLowerCase().includes(query.toLowerCase()) ||
      m.user?.email?.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpen = async (userId) => {
    if (!workspaceId) return;
    setOpening(userId);
    try {
      await openDm(userId, workspaceId);
      onClose();
    } catch {
      // noop
    } finally {
      setOpening(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--colors-surface-dark-elevated)] border border-white/10 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="text-white font-semibold text-base">New Direct Message</h2>
          <button
            onClick={onClose}
            className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <input
            id="dm-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members"
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-sm text-white placeholder-[rgba(255,255,255,0.3)] outline-none focus:border-[var(--colors-primary)] transition-colors"
            autoFocus
          />
          <div className="mt-3 max-h-60 overflow-y-auto space-y-1">
            {loading && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-[var(--colors-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && !filtered.length && (
              <p className="text-center text-sm text-[rgba(255,255,255,0.3)] py-4">
                {query ? 'No members match your search' : 'No workspace members found'}
              </p>
            )}
            {filtered.map((m) => (
              <button
                key={m.user?.id}
                id={`dm-user-${m.user?.id}`}
                onClick={() => handleOpen(m.user?.id)}
                disabled={!!opening}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {(m.user?.name ?? '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.user?.name}</p>
                  <p className="text-xs text-[rgba(255,255,255,0.4)] truncate">{m.user?.email}</p>
                </div>
                {opening === m.user?.id ? (
                  <div className="w-4 h-4 border-2 border-[var(--colors-primary)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-[rgba(255,255,255,0.2)] group-hover:text-[var(--colors-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
        {!workspaceId && (
          <p className="text-center text-xs text-yellow-400 opacity-70 px-4 pb-4">
            Select a workspace to send direct messages.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Conversation Header ──────────────────────────────────────────────────────
function ConversationHeader() {
  const { user } = useAuth();
  const { conversations, activeConversationId, closeConversation } = useChat();

  const active = conversations.find((c) => c.id === activeConversationId);
  if (!active) return null;

  const currentUserId = user?._id || user?.id;
  let title = 'Conversation';
  if (active.type === 'PROJECT') {
    title = active.project?.name ?? 'Project chat';
  } else {
    const other = (active.participants ?? []).find((p) => (p._id || p.id) !== currentUserId);
    title = other?.name ?? 'Direct Message';
  }

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-[var(--colors-primary)] shadow-[0_0_6px_var(--colors-primary)]" />
        <h2 className="text-white font-semibold text-[15px]">{title}</h2>
        {active.type === 'PROJECT' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--colors-primary-glow)] text-[var(--colors-primary)] font-medium">
            Project
          </span>
        )}
      </div>
      <button
        onClick={closeConversation}
        className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors lg:hidden"
        title="Close"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
}

function ProjectRoomLauncher() {
  const { projects, activeWorkspace } = useProject();
  const { openProjectConversation, activeConversationId } = useChat();
  const [opening, setOpening] = useState(null);

  if (!activeWorkspace) {
    return (
      <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-3 text-xs text-white/35">
        Create or select a workspace to see project rooms.
      </div>
    );
  }

  return (
    <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">Project rooms</p>
      <div className="space-y-1">
        {projects.slice(0, 5).map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={async () => {
              setOpening(project.id);
              try {
                await openProjectConversation(project.id);
              } finally {
                setOpening(null);
              }
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
              activeConversationId && opening !== project.id
                ? 'text-white/58 hover:bg-white/5 hover:text-white'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/8 text-[11px] font-bold text-white">
              {(project.name || 'P').slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate">{project.name}</span>
            {opening === project.id && <span className="h-3 w-3 animate-spin rounded-full border border-[var(--colors-primary)] border-t-transparent" />}
          </button>
        ))}
        {!projects.length && <p className="py-2 text-xs text-white/35">No projects in this workspace yet.</p>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { activeConversationId } = useChat();
  const { activeWorkspaceId } = useProject();
  const [showDmModal, setShowDmModal] = useState(false);

  return (
    <div className="flex h-full overflow-hidden bg-[var(--colors-surface-dark)]">
      {/* ── Left panel: conversation list ─────────────────────────────── */}
      <aside
        className={`flex flex-col border-r border-[rgba(255,255,255,0.06)] flex-shrink-0 transition-all duration-200 ${
          activeConversationId ? 'hidden lg:flex lg:w-[300px]' : 'w-full lg:w-[300px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <h1 className="text-white font-bold text-base">Messages</h1>
          <button
            id="new-dm-button"
            onClick={() => setShowDmModal(true)}
            className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[var(--colors-primary-glow)] text-[rgba(255,255,255,0.6)] hover:text-[var(--colors-primary)] transition-all flex items-center justify-center"
            title="New direct message"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <ProjectRoomLauncher />
        <ConversationList />
      </aside>

      {/* ── Right panel: thread + composer ───────────────────────────── */}
      <section
        className={`flex-1 flex flex-col min-w-0 ${
          !activeConversationId ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <ConversationHeader />
        <MessageThread />
        <MessageInput />
      </section>

      {/* ── DM picker modal ──────────────────────────────────────────── */}
      {showDmModal && (
        <NewDmModal workspaceId={activeWorkspaceId} onClose={() => setShowDmModal(false)} />
      )}
    </div>
  );
}
