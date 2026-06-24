/**
 * @file SocketContext.jsx
 * @description Real-time socket channel integration provider.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { aliasIds } from '../utils/helpers';
import { useAuth } from './AuthContext';

// ─── Context ──────────────────────────────────────────────────────────────────
const SocketContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
/**
 * Provider wrapper setting up socket.io connections for authenticated users.
 * Exposes listeners and emitters to the children tree.
 */
export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const listeners = useRef(new Map());

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  /**
   * Subscribe to a socket event. Returns an unsubscribe function.
   * Incoming payloads are passed through `aliasIds` so realtime data carries the
   * same `id`/`_id` duality as REST responses (see services/api.js).
   */
  const on = useCallback((event, handler) => {
    const wrapped = (payload) => handler(aliasIds(payload));
    socketRef.current?.on(event, wrapped);
    return () => socketRef.current?.off(event, wrapped);
  }, []);

  /** Emit a socket event */
  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, on, emit, socket: socketRef }}>
      {children}
    </SocketContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
