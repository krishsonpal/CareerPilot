import React, { useContext, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, User, Sparkles, AlertCircle } from "lucide-react";
import { AppContext } from "../context/AppContext";
import api from "../utils/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Simple utility to parse basic markdown for chat bubbles
const parseMarkdown = (text) => {
  if (!text) return "";
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-indigo-200 underline">$1</a>')
    .replace(/\n/g, '<br/>');
  return html;
};

const EmbeddedChatbot = () => {
  const { token, userRole } = useContext(AppContext);
  const isStudent = token && userRole === "student";

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm CareerPilot AI. I can analyze your resume, recommend jobs, and answer career questions. What would you like to explore today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  const generateBotResponse = async (userMessage) => {
    if (!isStudent) {
      return "Please log in as a candidate to use the AI Career Assistant.";
    }
    try {
      const { data } = await api.post(`/ai/chat`, { message: userMessage });
      return data.response || "I didn't quite get that. Could you rephrase?";
    } catch (error) {
      console.error("Chat error:", error);
      return "I'm having trouble connecting right now. Please try again later.";
    }
  };

  const handleSendMessage = async (messageText = null) => {
    const message = messageText || inputMessage.trim();
    if (!message) return;

    // Add user message
    const userMsg = { id: Date.now(), type: 'user', content: message, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const botResponseText = await generateBotResponse(message);
      const botMsg = { id: Date.now() + 1, type: 'bot', content: botResponseText, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, type: 'bot', content: "An error occurred. Please try again.", timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-[600px] max-h-[80vh]">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
            <Sparkles size={22} className="text-indigo-100" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Career AI Assistant</h3>
            <p className="text-indigo-200 text-sm">Powered by Gemini 2.0 Flash</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
          <span className="text-xs font-medium text-indigo-50">Online</span>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50"
      >
        {!isStudent && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Login Required</h4>
              <p className="text-xs text-amber-700 mt-1">You must be logged in as a student to chat with the AI and get personalized recommendations.</p>
              <Link to="/candidate-login" className="inline-block mt-2 text-xs font-bold text-indigo-600 hover:underline">Log in now &rarr;</Link>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
              
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm ${
                message.type === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white border border-indigo-100 text-indigo-600'
              }`}>
                {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`px-5 py-3.5 rounded-2xl shadow-sm ${
                message.type === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                <div 
                  className="text-[15px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
                />
              </div>
              
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center mt-1 shadow-sm">
                <Bot size={16} />
              </div>
              <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
                <span className="text-xs font-medium text-gray-400 ml-1">AI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-5 bg-white border-t border-gray-100">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder={isStudent ? "Ask about jobs, skills, or career advice..." : "Log in to chat..."}
            className="flex-1 bg-gray-50 border border-gray-200 focus:border-indigo-500 rounded-full px-5 py-3.5 text-sm focus:outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
            disabled={isTyping || !isStudent}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping || !isStudent}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white p-3.5 rounded-full transition-all shadow-md shadow-indigo-200 disabled:shadow-none active:scale-95 disabled:active:scale-100"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        
        <div className="flex items-center justify-center mt-4 gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium mr-1">Suggestions:</span>
          {["What skills do I need?", "Find me remote jobs", "Review my resume"].map((quick) => (
            <button
              key={quick}
              onClick={() => handleSendMessage(quick)}
              disabled={isTyping || !isStudent}
              className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
            >
              {quick}
            </button>
          ))}
        </div>
      </div>
      
    </div>
  );
};

export default EmbeddedChatbot;
