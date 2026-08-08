import axios from "axios";
// import { motion } from "framer-motion";
import { Bot, Loader2, Send, User } from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";

const EmbeddedChatbot = () => {
  const { backendUrl, userToken, userData } = useContext(AppContext);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Good evening! I'm your AI career assistant. I can help you discover job opportunities, provide career guidance, and answer any questions about your professional journey. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Mock job database
  // const jobDatabase = [
  //   {
  //     id: 1,
  //     title: "Senior Software Engineer",
  //     company: "TechFlow Inc.",
  //     location: "San Francisco, CA",
  //     skills: ["JavaScript", "React", "Node.js", "Python"],
  //     type: "Full-time",
  //     salary: "$120k - $150k",
  //     description: "Lead development of cutting-edge web applications and mentor junior developers.",
  //     category: "tech"
  //   },
  //   {
  //     id: 2,
  //     title: "Digital Marketing Manager",
  //     company: "BrandBoost Agency",
  //     location: "New York, NY",
  //     skills: ["Social Media Marketing", "Google Analytics", "SEO", "Content Strategy"],
  //     type: "Full-time",
  //     salary: "$80k - $100k",
  //     description: "Develop and execute comprehensive digital marketing strategies across multiple channels.",
  //     category: "marketing"
  //   },
  //   {
  //     id: 3,
  //     title: "UX/UI Designer",
  //     company: "DesignStudio Pro",
  //     location: "Remote",
  //     skills: ["Figma", "Adobe Creative Suite", "User Research", "Prototyping"],
  //     type: "Full-time",
  //     salary: "$90k - $120k",
  //     description: "Create user-centered designs and conduct usability research for mobile and web applications.",
  //     category: "design"
  //   },
  //   {
  //     id: 4,
  //     title: "Data Scientist",
  //     company: "DataCorp Analytics",
  //     location: "Seattle, WA",
  //     skills: ["Python", "SQL", "Machine Learning", "Tableau", "Statistics"],
  //     type: "Full-time",
  //     salary: "$110k - $140k",
  //     description: "Analyze large datasets and build predictive models for business insights.",
  //     category: "data"
  //   },
  //   {
  //     id: 5,
  //     title: "Cybersecurity Analyst",
  //     company: "SecureTech Solutions",
  //     location: "Austin, TX",
  //     skills: ["Security Analysis", "Network Security", "Incident Response", "Compliance"],
  //     type: "Full-time",
  //     salary: "$95k - $125k",
  //     description: "Protect organizational data and systems from cyber threats and vulnerabilities.",
  //     category: "cybersecurity"
  //   }
  // ];

  // AI Response Generator using FastAPI
  const generateBotResponse = async (userMessage) => {
    if (!userToken || !userData) {
      return {
        content: "Please login to use the AI assistant. I can help you with career guidance and internship recommendations once you're logged in!",
        jobs: []
      };
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/student/chat`,
        null,
        {
          params: { question: userMessage },
          headers: { Authorization: `Bearer ${userToken}` }
        }
      );

      if (data.intent === "recommend_internships" && data.recommendations) {
        return {
          content: data.recommendations.map(rec => 
            `**${rec.title}**\n${rec.description}\n📍 ${rec.location}\n💰 ${rec.stipend}\n⏱️ ${rec.duration}\n\n**Skills Required:** ${rec.skills}\n**Match Score:** ${rec.match_percentage}%`
          ).join('\n\n---\n\n'),
          jobs: data.recommendations
        };
      } else if (data.intent === "suggest_skills" && data.advice) {
        return {
          content: data.advice,
          jobs: []
        };
      } else if (data.answer) {
        return {
          content: data.answer,
          jobs: []
        };
      } else {
        return {
          content: "I'm here to help you with career guidance and internship recommendations. Please ask me about specific roles, skills, or career advice!",
          jobs: []
        };
      }
    } catch (error) {
      console.error("Chat error:", error);
      return {
        content: "I'm having trouble connecting to the AI service. Please try again later or contact support if the issue persists.",
        jobs: []
      };
    }
  };

  const handleSendMessage = async (messageText = null) => {
    const message = messageText || inputMessage.trim();
    if (!message) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const botResponse = await generateBotResponse(message);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse.content,
        timestamp: new Date(),
        jobs: botResponse.jobs
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I encountered an error. Please try again later.",
        timestamp: new Date(),
        jobs: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Job Card Component
  const JobCard = ({ job }) => {
    const normalizedId = job._id || job.id || job.job_id;
    return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 text-sm mb-1">{job.title}</h4>
          <p className="text-blue-600 text-xs font-medium">{job.location}</p>
        </div>
        <span className="text-xs text-gray-500">{job.stipend}</span>
      </div>
      <p className="text-gray-600 text-xs mb-2">{job.description}</p>
      <div className="flex flex-wrap gap-1">
        {job.skills && job.skills.split(',').slice(0, 3).map((skill, index) => (
          <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
            {skill.trim()}
          </span>
        ))}
      </div>
      {job.match_percentage && (
        <div className="mt-2">
          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
            Match: {job.match_percentage}%
          </span>
        </div>
      )}
      {normalizedId && (
        <button onClick={() => window.location.href = `/apply-job/${normalizedId}`}
          className="mt-3 text-xs bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600">
          View & Apply
        </button>
      )}
    </div>
  ); };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-white/20 p-2 rounded-full mr-3">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Career Assistant</h3>
            <p className="text-blue-100 text-xs">Claude Sonnet 4</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs">Online</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-start space-x-2 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border border-blue-200 text-blue-600'
                }`}>
                  {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                
                {/* Message Content */}
                <div className={`px-3 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                  
                  {/* Job Cards */}
                  {message.jobs && message.jobs.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.jobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-blue-200 text-blue-600 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-white px-3 py-2 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              ref={chatInputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="How can I help you today?"
              className="w-full border border-gray-300 focus:border-blue-500 rounded-full px-4 py-3 text-sm focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
              disabled={isTyping}
              maxLength={500}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
              {inputMessage.length}/500
            </div>
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-3 rounded-full transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
          >
            {isTyping ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center justify-center mt-3 space-x-2">
          <span className="text-xs text-gray-500">Quick start:</span>
          {["Programming", "Data Science", "Marketing", "Cybersecurity"].map((quick) => (
            <button
              key={quick}
              onClick={() => handleSendMessage(`Show me ${quick.toLowerCase()} jobs`)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-full transition-colors"
              disabled={isTyping}
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
