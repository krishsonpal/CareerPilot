/**
 * CareerPilot — useChat Hook (Socket.IO Streaming)
 *
 * Manages the Socket.IO connection to the backend's real-time chat endpoint.
 * Handles:
 *   - JWT-authenticated connection
 *   - Sending messages
 *   - Receiving token-by-token streaming responses
 *   - Assembling the full streamed message in real-time
 *   - Error states and disconnection recovery
 *
 * Usage:
 *   const { messages, sendMessage, isConnected, isStreaming } = useChat();
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const rawSocketUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const SOCKET_URL = rawSocketUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

// Token from localStorage (set by AuthContext on login)
function getToken() {
  return localStorage.getItem('token') || '';
}

export function useChat() {
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  // Track the currently streaming message (accumulates tokens)
  const streamingMsgRef = useRef('');

  // ── Connect ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token: `Bearer ${token}` },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    // ── Lifecycle events ──────────────────────────────────────────────────────
    socket.on('connect', () => {
      console.log('[useChat] Socket connected:', socket.id);
      setError(null);
    });

    socket.on('connected', (data) => {
      console.log('[useChat] Authenticated as user:', data.user_id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[useChat] Socket disconnected:', reason);
      setIsConnected(false);
      setIsStreaming(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[useChat] Connection error:', err.message);
      setError('Unable to connect to the AI assistant. Please try again.');
      setIsConnected(false);
    });

    // ── Streaming events ──────────────────────────────────────────────────────

    // Each token from the LLM stream
    socket.on('chat_token', ({ token }) => {
      streamingMsgRef.current += token;

      // Update the last message in the list (the streaming placeholder)
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant' && last.streaming) {
          updated[updated.length - 1] = {
            ...last,
            content: streamingMsgRef.current,
          };
        }
        return updated;
      });
    });

    // Stream complete
    socket.on('chat_done', ({ intent }) => {
      console.log('[useChat] Stream complete, intent:', intent);
      setIsStreaming(false);

      // Finalize the streaming message (remove streaming flag)
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant' && last.streaming) {
          updated[updated.length - 1] = {
            ...last,
            content: streamingMsgRef.current,
            streaming: false,
            intent,
          };
        }
        return updated;
      });

      streamingMsgRef.current = '';
    });

    // Error from server
    socket.on('chat_error', ({ message }) => {
      console.error('[useChat] Chat error:', message);
      setIsStreaming(false);
      setError(message);
      streamingMsgRef.current = '';

      // Replace streaming placeholder with error message
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant' && last.streaming) {
          updated[updated.length - 1] = {
            ...last,
            content: `⚠️ ${message}`,
            streaming: false,
            isError: true,
          };
        }
        return updated;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // Only connect once on mount

  // ── Send Message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback((text) => {
    if (!text?.trim()) return;
    if (!socketRef.current?.connected) {
      setError('Not connected. Please wait and try again.');
      return;
    }
    if (isStreaming) return; // Prevent sending while a response is streaming

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add streaming placeholder for assistant response
    const assistantPlaceholder = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      streaming: true,
      timestamp: new Date().toISOString(),
    };

    streamingMsgRef.current = '';
    setIsStreaming(true);
    setError(null);
    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

    socketRef.current.emit('chat_message', { message: text.trim() });
  }, [isStreaming]);

  // ── Clear History ──────────────────────────────────────────────────────────
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isConnected,
    isStreaming,
    error,
  };
}
