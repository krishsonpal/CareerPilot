import { AnimatePresence, motion } from "framer-motion";
import { Bot, Briefcase, ExternalLink, Loader2, MapPin, Send, Sparkles, User, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const InternshipChatbot = ({ 
  onInternshipSelect = null, 
  className = "",
  position = "fixed" // "fixed" or "inline"
}) => {
  const navigate = useNavigate();
  const chatInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI internship assistant. I can help you discover perfect internship opportunities based on your skills, interests, and career goals. What would you like to explore today?",
      timestamp: new Date(),
      suggestions: [
        "Find tech internships",
        "Marketing opportunities", 
        "Remote positions",
        "What skills do I need?",
        "How to get started?"
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Mock internship database
  const internshipDatabase = [
    {
      id: 1,
      title: "Software Development Intern",
      company: "TechFlow Inc.",
      location: "San Francisco, CA",
      skills: ["JavaScript", "React", "Node.js", "Python"],
      type: "Full-time",
      duration: "3 months",
      description: "Work on cutting-edge web applications and learn modern development practices.",
      salary: "$25/hour",
      requirements: ["Computer Science student", "Basic programming knowledge", "Problem-solving skills"],
      category: "tech"
    },
    {
      id: 2,
      title: "Digital Marketing Intern",
      company: "BrandBoost Agency",
      location: "New York, NY",
      skills: ["Social Media Marketing", "Content Creation", "Google Analytics", "SEO"],
      type: "Part-time",
      duration: "6 months",
      description: "Create engaging content and analyze marketing campaigns across digital platforms.",
      salary: "$20/hour",
      requirements: ["Marketing/Communications student", "Creative mindset", "Social media savvy"],
      category: "marketing"
    },
    {
      id: 3,
      title: "UX/UI Design Intern",
      company: "DesignStudio Pro",
      location: "Remote",
      skills: ["Figma", "Adobe Creative Suite", "User Research", "Prototyping", "Wireframing"],
      type: "Full-time",
      duration: "4 months",
      description: "Design user-centered interfaces and conduct usability research for mobile apps.",
      salary: "$22/hour",
      requirements: ["Design/HCI student", "Portfolio required", "Design thinking knowledge"],
      category: "design"
    },
    {
      id: 4,
      title: "Data Science Intern",
      company: "DataCorp Analytics",
      location: "Seattle, WA",
      skills: ["Python", "SQL", "Machine Learning", "Tableau", "Statistics"],
      type: "Full-time",
      duration: "6 months",
      description: "Analyze large datasets and build predictive models for business insights.",
      salary: "$28/hour",
      requirements: ["Statistics/CS student", "Python experience", "Analytical thinking"],
      category: "data"
    },
    {
      id: 5,
      title: "Product Management Intern",
      company: "InnovateLabs",
      location: "Austin, TX",
      skills: ["Product Strategy", "Market Research", "Agile", "User Stories", "Analytics"],
      type: "Full-time",
      duration: "4 months",
      description: "Help define product roadmaps and coordinate between engineering and design teams.",
      salary: "$24/hour",
      requirements: ["Business/Engineering student", "Leadership experience", "Communication skills"],
      category: "product"
    },
    {
      id: 6,
      title: "Content Marketing Intern",
      company: "ContentCrafter",
      location: "Remote",
      skills: ["Content Writing", "WordPress", "Email Marketing", "Social Media"],
      type: "Part-time",
      duration: "5 months",
      description: "Create compelling blog posts, newsletters, and social media content.",
      salary: "$18/hour",
      requirements: ["English/Marketing student", "Writing samples", "SEO knowledge helpful"],
      category: "marketing"
    },
    {
      id: 7,
      title: "Frontend Developer Intern",
      company: "WebWorks Studio",
      location: "Los Angeles, CA",
      skills: ["HTML", "CSS", "JavaScript", "React", "Responsive Design"],
      type: "Full-time",
      duration: "3 months",
      description: "Build responsive web interfaces and improve user experience across platforms.",
      salary: "$26/hour",
      requirements: ["Web Development experience", "Portfolio required", "Git knowledge"],
      category: "tech"
    },
    {
      id: 8,
      title: "Business Analyst Intern",
      company: "StrategicSolutions",
      location: "Chicago, IL",
      skills: ["Excel", "SQL", "Business Intelligence", "Process Analysis", "PowerPoint"],
      type: "Full-time",
      duration: "4 months",
      description: "Analyze business processes and create data-driven recommendations.",
      salary: "$23/hour",
      requirements: ["Business/Finance student", "Excel proficiency", "Analytical mindset"],
      category: "business"
    }
  ];

  // AI Response Generator
  const generateBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Tech/Software Development queries
    if (message.includes('tech') || message.includes('software') || message.includes('programming') || message.includes('developer') || message.includes('coding')) {
      const techInternships = internshipDatabase.filter(internship => 
        internship.category === 'tech'
      );
      return {
        content: "Excellent choice! Tech internships are in high demand and offer great learning opportunities. Here are some fantastic software development positions I found for you:",
        internships: techInternships,
        suggestions: ["Remote tech internships", "Frontend vs Backend?", "Required programming languages", "Tech interview tips"]
      };
    }
    
    // Marketing queries
    if (message.includes('marketing') || message.includes('social media') || message.includes('content') || message.includes('brand')) {
      const marketingInternships = internshipDatabase.filter(internship => 
        internship.category === 'marketing'
      );
      return {
        content: "Marketing is a dynamic and creative field! These internships will give you hands-on experience with modern digital marketing strategies:",
        internships: marketingInternships,
        suggestions: ["Content creation roles", "Social media marketing", "Analytics tools to learn", "Portfolio building tips"]
      };
    }

    // Design queries
    if (message.includes('design') || message.includes('ux') || message.includes('ui') || message.includes('creative')) {
      const designInternships = internshipDatabase.filter(internship => 
        internship.category === 'design'
      );
      return {
        content: "Design internships are perfect for creative problem-solvers! Here are opportunities where you can create amazing user experiences:",
        internships: designInternships,
        suggestions: ["Portfolio requirements", "Design tools to master", "User research methods", "Design thinking process"]
      };
    }

    // Data Science queries
    if (message.includes('data') || message.includes('analytics') || message.includes('machine learning') || message.includes('statistics')) {
      const dataInternships = internshipDatabase.filter(internship => 
        internship.category === 'data'
      );
      return {
        content: "Data science is one of the most exciting fields right now! These internships will teach you to extract insights from complex datasets:",
        internships: dataInternships,
        suggestions: ["Python vs R for data science", "SQL essentials", "Machine learning basics", "Data visualization tools"]
      };
    }

    // Remote work queries
    if (message.includes('remote') || message.includes('work from home') || message.includes('virtual')) {
      const remoteInternships = internshipDatabase.filter(internship => 
        internship.location === 'Remote'
      );
      return {
        content: "Remote internships offer flexibility and access to opportunities worldwide! Here are some excellent remote positions:",
        internships: remoteInternships,
        suggestions: ["Remote work best practices", "Communication tools", "Time management tips", "Building remote relationships"]
      };
    }

    // Skills and learning queries
    if (message.includes('skill') || message.includes('learn') || message.includes('requirement') || message.includes('prepare')) {
      return {
        content: "Great question! Here are the most in-demand skills across different fields:\n\n**🚀 Tech Skills:**\n• Programming: Python, JavaScript, React\n• Data: SQL, Excel, Tableau\n• Tools: Git, AWS, Docker\n\n**📈 Marketing Skills:**\n• Digital: SEO, Google Analytics, Social Media\n• Content: Writing, Video editing, Design basics\n• Strategy: Market research, A/B testing\n\n**🎨 Design Skills:**\n• Tools: Figma, Adobe Creative Suite, Sketch\n• Methods: User research, Prototyping, Wireframing\n• Thinking: Design systems, Accessibility\n\nWhat specific field interests you most?",
        suggestions: ["Tech skill roadmap", "Marketing certifications", "Design portfolio tips", "Learning resources"]
      };
    }

    // Application and career advice
    if (message.includes('apply') || message.includes('application') || message.includes('resume') || message.includes('interview')) {
      return {
        content: "Here's my step-by-step guide to landing your dream internship:\n\n**📝 Application Essentials:**\n• Tailor your resume for each position\n• Write compelling cover letters\n• Build a relevant portfolio\n• Get recommendations from professors\n\n**🎯 Interview Preparation:**\n• Research the company thoroughly\n• Practice common interview questions\n• Prepare specific examples (STAR method)\n• Have thoughtful questions ready\n\n**💡 Pro Tips:**\n• Apply early in the season\n• Network on LinkedIn\n• Follow up professionally\n• Show genuine enthusiasm\n\nNeed help with any specific part?",
        suggestions: ["Resume review tips", "Interview questions prep", "Portfolio examples", "Networking strategies"]
      };
    }

    // Getting started queries
    if (message.includes('start') || message.includes('begin') || message.includes('help') || message.includes('new')) {
      return {
        content: "I'm excited to help you start your internship journey! Here's what I can do for you:\n\n**🔍 Find Opportunities:**\n• Match internships to your skills and interests\n• Filter by location, duration, and type\n• Show salary ranges and requirements\n\n**📚 Career Guidance:**\n• Skill development recommendations\n• Industry insights and trends\n• Application and interview tips\n\n**🚀 Next Steps:**\n• Explore different career paths\n• Build your professional profile\n• Connect with the right opportunities\n\nWhat area would you like to explore first?",
        suggestions: ["Explore tech internships", "Marketing opportunities", "Show me all remote jobs", "Career advice"]
      };
    }

    // Salary and compensation queries
    if (message.includes('salary') || message.includes('pay') || message.includes('compensation') || message.includes('money')) {
      // const salaryInfo = internshipDatabase.map(i => ({ 
      //   field: i.category, 
      //   salary: i.salary, 
      //   title: i.title 
      // }));
      
      return {
        content: "Internship compensation varies by field, location, and company size. Here's what you can typically expect:\n\n**💰 Salary Ranges:**\n• Tech/Engineering: $22-30/hour\n• Data Science: $25-35/hour\n• Marketing: $15-25/hour\n• Design: $18-28/hour\n• Business: $20-28/hour\n\n**💡 Remember:**\n• Paid internships are becoming standard\n• Location significantly impacts pay\n• Large companies often pay more\n• Experience and skills affect rates\n\nWant to see specific internships with salary info?",
        suggestions: ["High-paying tech internships", "Entry-level opportunities", "Remote vs on-site pay", "Negotiation tips"]
      };
    }

    // Default response with variety
    const defaultResponses = [
      {
        content: "I'd love to help you find the perfect internship! Based on current market trends, here are some popular opportunities across different fields:",
        internships: internshipDatabase.slice(0, 3),
        suggestions: ["Show me tech roles", "Marketing internships", "Remote opportunities", "Salary information"]
      },
      {
        content: "Let me show you some exciting internship opportunities! These positions offer great learning experiences and career growth potential:",
        internships: internshipDatabase.slice(2, 5),
        suggestions: ["Filter by location", "Part-time options", "Skill requirements", "Application deadlines"]
      }
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
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

    // Simulate realistic AI response delay
    setTimeout(() => {
      const botResponse = generateBotResponse(message);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse.content,
        timestamp: new Date(),
        internships: botResponse.internships,
        suggestions: botResponse.suggestions
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800); // Random delay between 1.2-2s for realism
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleInternshipClick = (internship) => {
    if (onInternshipSelect) {
      onInternshipSelect(internship);
    } else {
      navigate('/internships/' + internship.id);
    }
  };

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Enhanced Internship Card Component
  const InternshipCard = ({ internship }) => (
    <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 mb-3 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-bold text-gray-800 text-base leading-tight mb-1">
            {internship.title}
          </h4>
          <p className="text-blue-600 font-semibold text-sm">{internship.company}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            internship.type === 'Full-time' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {internship.type}
          </span>
          <span className="text-xs text-gray-500">{internship.duration}</span>
        </div>
      </div>

      {/* Location and Salary */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
        <div className="flex items-center">
          <MapPin size={14} className="mr-1" />
          <span>{internship.location}</span>
        </div>
        <div className="flex items-center font-semibold text-green-600">
          <Briefcase size={14} className="mr-1" />
          <span>{internship.salary}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 text-sm mb-3 leading-relaxed">
        {internship.description}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mb-4">
        {internship.skills.slice(0, 4).map((skill, index) => (
          <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium border border-blue-200">
            {skill}
          </span>
        ))}
        {internship.skills.length > 4 && (
          <span className="text-xs text-gray-500 px-2 py-1">
            +{internship.skills.length - 4} more
          </span>
        )}
      </div>

      {/* Action Button */}
      <button 
        onClick={() => handleInternshipClick(internship)}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center justify-center group"
      >
        <span>View Details & Apply</span>
        <ExternalLink size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  // Toggle Button Component
  const ChatToggleButton = () => (
    <motion.button
      onClick={() => setIsChatOpen(!isChatOpen)}
      className={`${position === 'fixed' ? 'fixed bottom-6 right-6' : 'relative'} bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50 group ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait">
        {isChatOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X size={24} />
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center"
          >
            <Bot size={24} />
            <Sparkles size={16} className="ml-1 text-yellow-300 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced Tooltip */}
      <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg">
        <div className="relative">
          Ask me about internships! 🚀
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </motion.button>
  );

  // Chat Interface Component  
  const ChatInterface = () => (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, type: "spring", damping: 25 }}
          className={`${
            position === 'fixed' 
              ? 'fixed bottom-24 right-6' 
              : 'relative'
          } w-[420px] max-w-[calc(100vw-3rem)] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 flex flex-col overflow-hidden`}
        >
          {/* Enhanced Chat Header */}
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-2.5 rounded-full mr-3 backdrop-blur-sm">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base">AI Internship Assistant</h3>
                <p className="text-blue-100 text-sm">Powered by advanced AI • Always learning</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-sm ml-2 font-medium">Online</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100"
            style={{ scrollBehavior: 'smooth' }}
          >
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-end space-x-2 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                        : 'bg-white border-2 border-blue-200 text-blue-600'
                    }`}>
                      {message.type === 'user' ? <User size={18} /> : <Bot size={18} />}
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                      {/* Message Content */}
                      <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                      }`}>
                        <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                      </div>

                      {/* Internship Cards */}
                      {message.internships && (
                        <div className="space-y-3">
                          {message.internships.map((internship) => (
                            <InternshipCard key={internship.id} internship={internship} />
                          ))}
                        </div>
                      )}

                      {/* Suggestions */}
                      {message.suggestions && (
                        <div className="flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, index) => (
                            <motion.button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-sm bg-white hover:bg-blue-50 text-blue-600 px-3 py-2 rounded-full border border-blue-200 hover:border-blue-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {suggestion}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Enhanced Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-end space-x-2">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white border-2 border-blue-200 text-blue-600 flex items-center justify-center shadow-sm">
                    <Bot size={18} />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Enhanced Chat Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask me anything about internships..."
                  className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-full px-4 py-3 text-sm focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                  disabled={isTyping}
                  maxLength={500}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  {inputMessage.length}/500
                </div>
              </div>
              <motion.button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-3 rounded-full transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isTyping ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </motion.button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center justify-center mt-3 space-x-2">
              <span className="text-xs text-gray-500">Quick start:</span>
              {["Tech", "Marketing", "Remote", "Skills"].map((quick) => (
                <button
                  key={quick}
                  onClick={() => handleSendMessage(`Show me ${quick.toLowerCase()} internships`)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-full transition-colors"
                  disabled={isTyping}
                >
                  {quick}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <ChatToggleButton />
      <ChatInterface />
    </>
  );
};

export default InternshipChatbot;