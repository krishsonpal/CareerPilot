import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Bot,
  User,
  Send,
  RefreshCw,
  Zap,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  MessageSquare
} from "lucide-react";
import { useChat } from "../../hooks/useChat";
import ResumeContextRail from "../../components/ResumeContextRail";

// ── Custom Markdown Renderer for Assistant Responses ────────────────────────
function renderAssistantMarkdown(text) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Code block detection
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "code";
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      const codeString = codeLines.join("\n");
      elements.push(
        <div key={key++} className="my-3 rounded-xl bg-slate-900 text-slate-100 p-3.5 text-xs font-mono border border-slate-800 overflow-x-auto relative group">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase">
            <span>{lang}</span>
            <button
              onClick={() => navigator.clipboard.writeText(codeString)}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <Copy size={11} /> Copy
            </button>
          </div>
          <pre className="whitespace-pre-wrap">{codeString}</pre>
        </div>
      );
      continue;
    }

    // Bullet points
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ") || line.trim().startsWith("* ")) {
      const content = line.replace(/^[\s\-•*]+/, "");
      elements.push(
        <div key={key++} className="flex items-start gap-2.5 my-1.5 pl-1 text-sm leading-relaxed text-slate-800">
          <span className="text-indigo-600 font-black text-base shrink-0 leading-none mt-1">▸</span>
          <div>{parseInline(content)}</div>
        </div>
      );
      continue;
    }

    // Numbered list (e.g. 1. , 2. )
    if (/^\d+\.\s/.test(line.trim())) {
      const match = line.trim().match(/^(\d+)\.\s(.*)/);
      if (match) {
        elements.push(
          <div key={key++} className="flex items-start gap-2 my-1.5 pl-1 text-sm leading-relaxed text-slate-800">
            <span className="text-indigo-600 font-bold text-xs bg-indigo-50 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
              {match[1]}.
            </span>
            <div>{parseInline(match[2])}</div>
          </div>
        );
        continue;
      }
    }

    // Section Headings (##, ###)
    if (line.startsWith("## ") || line.startsWith("### ")) {
      const content = line.replace(/^#{2,3}\s/, "");
      elements.push(
        <h4 key={key++} className="font-extrabold text-slate-900 text-sm sm:text-base mt-4 mb-1.5 text-indigo-950">
          {parseInline(content)}
        </h4>
      );
      continue;
    }

    // Standard Paragraph
    elements.push(
      <p key={key++} className="my-1.5 text-sm leading-relaxed text-slate-800">
        {parseInline(line)}
      </p>
    );
  }

  return elements;
}

function parseInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono font-medium border border-indigo-100">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ── Streaming Cursor Indicator ──────────────────────────────────────────────
function StreamingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ repeat: Infinity, duration: 0.8 }}
      className="inline-block ml-1 text-indigo-600 font-black text-sm"
    >
      ▋
    </motion.span>
  );
}

// ── Suggested Prompt Chips ──────────────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  "What jobs match my resume profile?",
  "What skills should I add for Google AI roles?",
  "Review my experience gaps & weaknesses",
  "Suggest 3 portfolio projects for Python Backend",
];

const Assistant = () => {
  const { messages, sendMessage, clearMessages, isConnected, isStreaming, error } = useChat();
  const [inputText, setInputText] = useState("");
  const location = useLocation();
  const chatBottomRef = useRef(null);
  const textareaRef = useRef(null);
  const initialSentRef = useRef(false);

  // Auto-scroll on new tokens
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Handle initial prompt passed from navigation state (e.g. from Overview / Hero)
  useEffect(() => {
    if (location.state?.initialPrompt && isConnected && !initialSentRef.current) {
      initialSentRef.current = true;
      sendMessage(location.state.initialPrompt);
    }
  }, [location.state, isConnected, sendMessage]);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || isStreaming) return;
    setInputText("");
    sendMessage(trimmed);
  }, [inputText, isStreaming, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = (chip) => {
    if (isStreaming) return;
    sendMessage(chip);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="text-indigo-600" size={26} />
            <span>AI Career Assistant</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time streaming career guidance context-aware to your resume profile.
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs text-xs font-bold">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700">Socket.IO Live Streaming</span>
              </>
            ) : (
              <>
                <Loader2 size={12} className="animate-spin text-amber-500" />
                <span className="text-amber-700">Connecting to LLM...</span>
              </>
            )}
          </div>

          <button
            onClick={clearMessages}
            title="Reset Conversation"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Full-Height Chat Console (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[700px] overflow-hidden">
          
          {/* Chat Window Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">CareerPilot Coach</h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Gemini 3.1 Flash • FAISS Intent Vector Search
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              Resume Injected
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-10">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-xs border border-indigo-100">
                  <Bot size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  How can I help your career today?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                  Ask for job recommendations, resume skill gap analysis, interview preparation tips, or tech stack roadmaps.
                </p>

                {/* Suggestion Chips */}
                <div className="w-full space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">
                    Suggested Prompts:
                  </p>
                  {QUICK_SUGGESTIONS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(chip)}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-200 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-700 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-indigo-500" />
                        {chip}
                      </span>
                      <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render Messages */}
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 text-xs font-bold shadow-xs ${
                      isUser
                        ? "bg-slate-800"
                        : "bg-gradient-to-tr from-indigo-600 to-violet-600"
                    }`}
                  >
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[82%] sm:max-w-[78%] rounded-2xl px-4 py-3.5 shadow-xs ${
                      isUser
                        ? "bg-slate-900 text-white text-sm font-medium rounded-tr-xs"
                        : "bg-slate-50 border border-slate-200/80 text-slate-900 rounded-tl-xs"
                    }`}
                  >
                    {isUser ? (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    ) : (
                      <div className="prose prose-sm max-w-none text-slate-900">
                        {renderAssistantMarkdown(msg.content)}
                        {msg.streaming && <StreamingCursor />}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Bottom Input Area */}
          <div className="p-3 sm:p-4 border-t border-slate-100 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 focus-within:border-indigo-500 focus-within:bg-white rounded-2xl p-2 transition-all shadow-xs"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about jobs, resume improvements, tech stacks..."
                className="flex-1 bg-transparent resize-none outline-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-medium px-2 py-1 max-h-32"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isStreaming}
                className={`p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white transition-all shadow-xs shrink-0 cursor-pointer ${
                  !inputText.trim() || isStreaming
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:shadow-md hover:scale-105 active:scale-95"
                }`}
              >
                {isStreaming ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Shift + Enter for new line • Responses are context-aware to your resume profile
            </p>
          </div>

        </div>

        {/* Right Column: Resume Context Rail (4 cols on lg) */}
        <div className="lg:col-span-4">
          <ResumeContextRail />
        </div>

      </div>

    </div>
  );
};

export default Assistant;
