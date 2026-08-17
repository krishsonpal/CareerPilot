/**
 * CareerPilot — AI Career Assistant Chat (Socket.IO Streaming)
 *
 * Real-time streaming chat powered by:
 *   - Socket.IO WebSocket for token-by-token Gemini response streaming
 *   - FAISS multi-vector intent search for contextual job recommendations
 *   - LangChain for conversation history management
 *
 * Features:
 *   - Token-level streaming (characters appear as they are generated)
 *   - Markdown rendering of responses
 *   - Animated typing indicator while connecting
 *   - Auto-scroll to latest message
 *   - Connection status badge
 *   - Suggested quick questions
 *   - Floating or inline positioning
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  Bot, Loader2, Send, Sparkles, User, X, Wifi, WifiOff,
  RefreshCw, MessageCircle, Zap
} from "lucide-react";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "../../hooks/useChat";

// ── Markdown to JSX — simple renderer (bold, code, bullet lists) ─────────────
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let key = 0;

  for (const line of lines) {
    if (!line.trim()) {
      elements.push(<br key={key++} />);
      continue;
    }

    // Bullet list
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      const content = line.replace(/^[\s\-•]+/, '');
      elements.push(
        <div key={key++} style={{ display: 'flex', gap: '6px', margin: '2px 0' }}>
          <span style={{ color: '#a78bfa', flexShrink: 0 }}>▸</span>
          <span>{inlineParse(content)}</span>
        </div>
      );
      continue;
    }

    // Heading (## or **heading**)
    if (line.startsWith('## ') || line.startsWith('### ')) {
      const content = line.replace(/^#{2,3}\s/, '');
      elements.push(
        <div key={key++} style={{ fontWeight: 700, color: '#c4b5fd', marginTop: '8px', marginBottom: '2px', fontSize: '0.85em' }}>
          {inlineParse(content)}
        </div>
      );
      continue;
    }

    elements.push(<div key={key++} style={{ margin: '2px 0' }}>{inlineParse(line)}</div>);
  }

  return elements;
}

function inlineParse(text) {
  // **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#e2d9f3' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{
          background: 'rgba(139,92,246,0.2)',
          borderRadius: '3px',
          padding: '1px 4px',
          fontSize: '0.9em',
          color: '#c4b5fd',
          fontFamily: 'monospace'
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ── Streaming cursor ─────────────────────────────────────────────────────────
function StreamingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ repeat: Infinity, duration: 0.8 }}
      style={{ display: 'inline-block', marginLeft: '1px', color: '#a78bfa' }}
    >
      ▋
    </motion.span>
  );
}

// ── Suggested questions ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  "What jobs match my resume?",
  "How can I improve my profile?",
  "Find remote Python internships",
  "What skills should I learn next?",
  "Review my experience gaps",
];

// ── Main component ────────────────────────────────────────────────────────────
const InternshipChatbot = ({
  className = "",
  position = "fixed",
}) => {
  const { messages, sendMessage, clearMessages, isConnected, isStreaming, error } = useChat();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages/tokens
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isChatOpen]);

  const handleSend = useCallback(() => {
    const text = inputMessage.trim();
    if (!text || isStreaming) return;
    setInputMessage("");
    sendMessage(text);
  }, [inputMessage, isStreaming, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const chatWindowStyle = {
    position: position === "fixed" ? "fixed" : "relative",
    bottom: position === "fixed" ? "100px" : undefined,
    right: position === "fixed" ? "24px" : undefined,
    width: "380px",
    height: "560px",
    background: "linear-gradient(145deg, #0f0a1e 0%, #1a1035 50%, #0f0a1e 100%)",
    border: "1px solid rgba(139,92,246,0.3)",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.15)",
    zIndex: 9999,
  };

  // ── Chat bubble (FAB) ──────────────────────────────────────────────────────
  const FloatingButton = () => (
    <motion.button
      onClick={() => setIsChatOpen(true)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 32px rgba(124,58,237,0.5)",
        zIndex: 9998,
      }}
    >
      <Bot size={26} color="white" />
      {!isConnected && (
        <span style={{
          position: "absolute",
          top: 0, right: 0,
          width: 14, height: 14,
          background: "#f59e0b",
          borderRadius: "50%",
          border: "2px solid #0f0a1e",
        }} />
      )}
    </motion.button>
  );

  return (
    <>
      {/* Floating Action Button */}
      {position === "fixed" && !isChatOpen && <FloatingButton />}

      <AnimatePresence>
        {(position === "inline" || isChatOpen) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={chatWindowStyle}
          >
            {/* ── Header ────────────────────────────────────────────────── */}
            <div style={{
              padding: "16px 20px",
              background: "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(79,70,229,0.3))",
              borderBottom: "1px solid rgba(139,92,246,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexShrink: 0,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Sparkles size={20} color="white" />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "white", fontSize: "0.95rem" }}>
                  CareerPilot AI
                </div>
                <div style={{ fontSize: "0.72rem", color: isConnected ? "#4ade80" : "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>
                  {isConnected ? (
                    <><Zap size={10} /><span>Live streaming</span></>
                  ) : (
                    <><Loader2 size={10} className="animate-spin" /><span>Connecting...</span></>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={clearMessages}
                  title="Clear chat"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: "4px" }}
                >
                  <RefreshCw size={16} />
                </button>
                {position === "fixed" && (
                  <button
                    onClick={() => setIsChatOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: "4px" }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* ── Messages ─────────────────────────────────────────────── */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(139,92,246,0.3) transparent",
            }}>
              {/* Welcome message when empty */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ textAlign: "center", padding: "20px 12px" }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>✨</div>
                  <div style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, marginBottom: "6px" }}>
                    AI Career Assistant
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", marginBottom: "16px" }}>
                    Powered by FAISS semantic search + Gemini streaming
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        style={{
                          background: "rgba(139,92,246,0.15)",
                          border: "1px solid rgba(139,92,246,0.3)",
                          borderRadius: "20px",
                          padding: "6px 12px",
                          color: "#c4b5fd",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { e.target.style.background = "rgba(139,92,246,0.3)"; }}
                        onMouseLeave={e => { e.target.style.background = "rgba(139,92,246,0.15)"; }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Message list */}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                    alignItems: "flex-start",
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                      : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {msg.role === "user" ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
                  </div>

                  {/* Bubble */}
                  <div style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                      : msg.isError
                      ? "rgba(239,68,68,0.2)"
                      : "rgba(255,255,255,0.07)",
                    border: msg.role === "user" ? "none" : "1px solid rgba(139,92,246,0.2)",
                    color: "rgba(255,255,255,0.9)",
                    fontSize: "0.88rem",
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                  }}>
                    {msg.role === "assistant"
                      ? renderMarkdown(msg.content)
                      : msg.content
                    }
                    {msg.streaming && <StreamingCursor />}
                    {/* Empty streaming placeholder shows loader */}
                    {msg.streaming && !msg.content && (
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                            style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa" }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Error banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    color: "#fca5a5",
                    fontSize: "0.82rem",
                    textAlign: "center",
                  }}
                >
                  ⚠️ {error}
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* ── Input ────────────────────────────────────────────────── */}
            <div style={{
              padding: "12px 16px",
              borderTop: "1px solid rgba(139,92,246,0.2)",
              background: "rgba(0,0,0,0.2)",
              flexShrink: 0,
            }}>
              <div style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: "14px",
                padding: "8px 12px",
              }}>
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isConnected ? "Ask about jobs, skills, career advice..." : "Connecting..."}
                  disabled={!isConnected || isStreaming}
                  rows={1}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "white",
                    fontSize: "0.88rem",
                    resize: "none",
                    lineHeight: 1.5,
                    fontFamily: "inherit",
                    maxHeight: "80px",
                    overflowY: "auto",
                  }}
                />
                <motion.button
                  onClick={handleSend}
                  disabled={!inputMessage.trim() || isStreaming || !isConnected}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: 34, height: 34,
                    borderRadius: "10px",
                    background: inputMessage.trim() && !isStreaming
                      ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                      : "rgba(255,255,255,0.1)",
                    border: "none",
                    cursor: inputMessage.trim() && !isStreaming ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  {isStreaming
                    ? <Loader2 size={16} color="white" style={{ animation: "spin 1s linear infinite" }} />
                    : <Send size={16} color="white" />
                  }
                </motion.button>
              </div>
              <div style={{ textAlign: "center", marginTop: "6px", fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}>
                Powered by Gemini • FAISS semantic search
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InternshipChatbot;