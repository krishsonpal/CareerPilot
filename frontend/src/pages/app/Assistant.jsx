import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  MessageSquarePlus,
  HelpCircle
} from "lucide-react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import { AppContext } from "../../context/AppContext";
import ResumeContextRail from "../../components/ResumeContextRail";
import api from "../../utils/api";

const Assistant = () => {
  const { token, userData } = useContext(AppContext);
  const location = useLocation();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const quickPrompts = [
    "What jobs match my resume best?",
    "Find remote Python / FastAPI roles",
    "Identify my skills gap for AI Engineer positions",
    "How can I improve my project bullet points?",
  ];

  // Initialize Socket.IO connection
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const socketUrl = baseUrl.replace(/\/api\/?$/, "");

    const socket = io(socketUrl, {
      path: "/ws/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to AI Chat Socket");
    });

    socket.on("chunk", (data) => {
      const chunkText = typeof data === "string" ? data : (data?.chunk || data?.content || "");
      if (!chunkText) return;

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === "assistant" && lastMsg.isStreaming) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...lastMsg,
            content: lastMsg.content + chunkText,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              role: "assistant",
              content: chunkText,
              isStreaming: true,
              timestamp: new Date(),
            },
          ];
        }
      });
    });

    socket.on("done", () => {
      setIsStreaming(false);
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...lastMsg,
            isStreaming: false,
          };
          return updated;
        }
        return prev;
      });
    });

    socket.on("error", (err) => {
      setIsStreaming(false);
      const errMsg = typeof err === "string" ? err : (err?.message || "AI response failed");
      toast.error(errMsg);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Load chat history from REST API on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get("/student/chat-history");
        if (data && Array.isArray(data) && data.length > 0) {
          setMessages(
            data.map((item) => ({
              role: item.role || (item.is_user ? "user" : "assistant"),
              content: item.content || item.message,
              timestamp: item.timestamp || new Date(),
              isStreaming: false,
            }))
          );
        } else {
          // Welcome greeting
          setMessages([
            {
              role: "assistant",
              content: `Hello ${userData?.full_name?.split(" ")[0] || "there"}! I'm your AI Career Coach. I have direct access to your parsed resume profile and verified job postings.\n\nHow can I help you accelerate your job search today?`,
              timestamp: new Date(),
              isStreaming: false,
            },
          ]);
        }
      } catch (err) {
        setMessages([
          {
            role: "assistant",
            content: "Hello! I'm your AI Career Coach. Ask me about job matches, skill gaps, or resume optimization advice.",
            timestamp: new Date(),
            isStreaming: false,
          },
        ]);
      }
    };
    fetchHistory();
  }, []);

  // Handle incoming initial prompt from navigation state
  useEffect(() => {
    if (location.state?.initialPrompt) {
      const prompt = location.state.initialPrompt;
      window.history.replaceState({}, document.title);
      setTimeout(() => {
        handleSendMessage(prompt);
      }, 300);
    }
  }, [location.state]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSendMessage = (textToSend) => {
    const messageText = (textToSend || inputValue).trim();
    if (!messageText || isStreaming) return;

    // Add user message
    const userMessage = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsStreaming(true);

    // Send to WebSocket
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("message", { message: messageText });
    } else {
      // Fallback REST HTTP endpoint
      api
        .post("/student/chat", { message: messageText })
        .then(({ data }) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.reply || data.response || "No response received",
              timestamp: new Date(),
              isStreaming: false,
            },
          ]);
        })
        .catch((err) => {
          toast.error("Failed to send message via HTTP fallback");
        })
        .finally(() => {
          setIsStreaming(false);
        });
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. What career goals or matching opportunities would you like to explore?",
        timestamp: new Date(),
        isStreaming: false,
      },
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left / Main Workspace: Full-Page Chat (8 cols on lg) */}
      <div className="lg:col-span-8 flex flex-col h-[calc(100vh-8rem)] bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        
        {/* Chat Header Bar */}
        <div className="px-5 py-4 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>AI Career Assistant</span>
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </h2>
              <p className="text-xs text-muted-foreground">
                Socket.IO Token Streaming • LangChain Powered
              </p>
            </div>
          </div>

          <button
            onClick={clearChat}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
            title="Reset Conversation"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Messages Stream Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={idx}
                className={`flex gap-3 items-start ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    isUser
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-muted text-foreground border border-border"
                  }`}
                >
                  {isUser ? <User size={15} /> : <Bot size={15} />}
                </div>

                {/* Message Bubble Card */}
                <div
                  className={`relative max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-primary text-primary-foreground font-medium rounded-tr-xs shadow-xs"
                      : "bg-muted/40 text-foreground border border-border rounded-tl-xs"
                  }`}
                >
                  {/* Markdown text representation */}
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse align-middle" />
                    )}
                  </div>

                  {/* Copy Button for Assistant responses */}
                  {!isUser && !msg.isStreaming && (
                    <button
                      onClick={() => copyToClipboard(msg.content, idx)}
                      className="absolute bottom-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-card transition-colors opacity-70 hover:opacity-100"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? (
                        <Check size={12} className="text-primary" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompt Chips */}
        <div className="px-4 py-2 border-t border-border bg-card flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles size={11} className="text-primary" /> Prompts:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              disabled={isStreaming}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] font-medium bg-muted hover:bg-muted/80 text-foreground border border-border px-3 py-1 rounded-full shrink-0 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 border-t border-border bg-card flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about matching roles, interview prep, skill gaps..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isStreaming}
            className="flex-1 bg-input/70 border border-border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-card transition-all font-medium"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isStreaming}
            className={`bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98] text-xs flex items-center gap-1.5 cursor-pointer ${
              !inputValue.trim() || isStreaming ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90"
            }`}
          >
            <span>Send</span>
            <Send size={13} />
          </button>
        </form>

      </div>

      {/* Right: Live Resume Context Rail (4 cols on lg) */}
      <div className="lg:col-span-4">
        <ResumeContextRail />
      </div>

    </div>
  );
};

export default Assistant;
