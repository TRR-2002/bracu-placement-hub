import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

// Helper to format time ago
const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// Helper to format message time
const formatMessageTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Helper to get initials from name
const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ComposeModal Component
const ComposeModal = ({ onClose, onConversationStart }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStartChat = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const cleanEmail = email.trim().toLowerCase();

      const response = await fetch(
        `http://localhost:1350/api/users/find-by-email?email=${encodeURIComponent(
          cleanEmail
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "User not found");
      }

      if (data.success && data.user) {
        onConversationStart({
          withUser: data.user,
          lastMessage: { content: "", createdAt: new Date().toISOString() },
          unreadCount: 0,
        });
        onClose();
      }
    } catch (err) {
      setError(
        err.message || "User not found. Please check the email address."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
        <h2 className="text-2xl font-black mb-2 text-gray-900 tracking-tight">New Message</h2>
        <p className="text-gray-500 mb-6 text-sm">Start a conversation with anyone on the platform.</p>
        <form onSubmit={handleStartChat}>
          <label className="block text-gray-700 font-bold mb-2 text-xs uppercase tracking-wider">
            Recipient's Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. jason@g.bracu.ac.bd"
            className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 placeholder-gray-400"
            required
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-3 flex items-center gap-1 font-medium">⚠️ {error}</p>}
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-2xl font-bold transition shadow-lg active:scale-95 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-200 text-white"
              }`}
            >
              {loading ? "Searching..." : "Start Chat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function MessagesPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]);
  const [newMessageContent, setNewMessageContent] = useState("");

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const token = localStorage.getItem("token");

  const useQuery = () => {
    return new URLSearchParams(window.location.search);
  };
  const query = useQuery();
  const targetUserId = query.get("userId");
  const location = useLocation();
  const stateSelectedUser = location.state?.selectedUser;

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const response = await fetch(
        "http://localhost:1350/api/messages/conversations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load conversations");
      }

      if (data.success) {
        const _conversations = data.conversations || [];
        setConversations(_conversations);

        if (targetUserId && !activeConversation) {
          const existingConvo = _conversations.find(
            (c) => c.withUser?._id === targetUserId
          );
          if (existingConvo) {
            setActiveConversation(existingConvo);
          } else if (stateSelectedUser && stateSelectedUser._id === targetUserId) {
             setActiveConversation({
               withUser: stateSelectedUser,
               lastMessage: null,
               unreadCount: 0
             });
          }
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      if (!silent) setError("Failed to load conversations.");
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchConversations();
    const interval = setInterval(() => fetchConversations(true), 5000);
    return () => clearInterval(interval);
  }, [token, navigate]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!activeConversation || !activeConversation.withUser) return;

      setLoadingHistory(true);
      setError("");

      try {
        const response = await fetch(
          `http://localhost:1350/api/messages/history/${activeConversation.withUser._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load message history");
        }

        if (data.success) {
          setMessageHistory(data.messages || []);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("Failed to load message history.");
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [activeConversation?._id, activeConversation?.withUser?._id, token]);

  const scrollToBottom = (behavior = "smooth") => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (
      !newMessageContent.trim() ||
      !activeConversation ||
      !activeConversation.withUser
    ) {
      return;
    }

    const messageContent = newMessageContent.trim();
    const tempMessageId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempMessageId,
      content: messageContent,
      createdAt: new Date().toISOString(),
      isMine: true,
    };

    setMessageHistory((prev) => [...prev, optimisticMessage]);
    setNewMessageContent("");
    setSendingMessage(true);

    try {
      const response = await fetch("http://localhost:1350/api/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: activeConversation.withUser._id,
          content: messageContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      if (data.success && data.messageData) {
        const realMessage = { ...data.messageData, isMine: true };
        setMessageHistory((prev) =>
          prev.map((msg) => (msg._id === tempMessageId ? realMessage : msg))
        );
      }

      fetchConversations(true);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
      setMessageHistory((prev) =>
        prev.filter((msg) => msg._id !== tempMessageId)
      );
      setNewMessageContent(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans">
      <Navbar />
      
      {showComposeModal && (
        <ComposeModal
          onClose={() => setShowComposeModal(false)}
          onConversationStart={(convo) => {
            setActiveConversation(convo);
            setShowComposeModal(false);
          }}
        />
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden bg-white">
        
        {/* LEFT SIDEBAR - Conversation List */}
        <div className="hidden md:flex w-80 lg:w-96 flex-col border-r bg-white z-10">
          <div className="p-6 border-b flex justify-between items-center bg-white">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Messages</h1>
            <button
              onClick={() => setShowComposeModal(true)}
              className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition shadow-sm border border-blue-100 active:scale-95"
              title="New Message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loadingConversations ? (
              <div className="p-4 space-y-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="animate-pulse flex gap-3 p-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400">
                <div className="bg-gray-50 p-8 rounded-[40px] mb-4">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="font-bold text-gray-900 text-lg">No conversations</p>
                <p className="text-sm mt-1 max-w-[200px]">Click the plus icon to start chatting with peers or recruiters.</p>
              </div>
            ) : (
              conversations
                .filter(convo => convo && convo.withUser)
                .map((convo) => {
                  const isActive = activeConversation?.withUser?._id === convo.withUser._id;
                  return (
                    <div
                      key={convo.withUser._id}
                      onClick={() => setActiveConversation(convo)}
                      className={`group flex items-center gap-4 p-4 cursor-pointer rounded-2xl transition-all duration-300 mb-1 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xl shadow-blue-200 ring-4 ring-blue-50"
                          : "hover:bg-blue-50 text-gray-800 active:scale-[0.98]"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 transition-all ${
                        isActive ? "bg-white/20 text-white rotate-6" : "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 group-hover:bg-white"
                      }`}>
                        {getInitials(convo.withUser.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className={`font-black truncate tracking-tight ${isActive ? "text-white" : "text-gray-900"}`}>
                            {convo.withUser.name}
                          </h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ml-2 opacity-60`}>
                            {convo.lastMessage ? formatTimeAgo(convo.lastMessage.createdAt) : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate font-medium ${isActive ? "text-blue-50" : "text-gray-500"}`}>
                            {convo.lastMessage?.content || "Tap to say hello!"}
                          </p>
                          {convo.unreadCount > 0 && !isActive && (
                            <span className="bg-red-500 text-white text-[10px] font-black rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-lg transform scale-110">
                              {convo.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* RIGHT SIDE - Chat Window */}
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b z-20 sticky top-0">
                <div className="flex items-center gap-4">
                  <div className="md:hidden">
                    <button onClick={() => setActiveConversation(null)} className="text-gray-500 bg-gray-100 p-2 rounded-xl active:scale-90 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 rounded-2xl flex items-center justify-center font-black shadow-inner border border-white">
                    {getInitials(activeConversation.withUser.name)}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 leading-tight tracking-tight">
                      {activeConversation.withUser.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest flex items-center gap-2">
                        <span>{activeConversation.withUser.role || "Member"}</span>
                        <span className="opacity-30 text-gray-400">•</span>
                        <span className="lowercase font-medium text-gray-400 select-all tracking-normal">{activeConversation.withUser.email}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Content */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-6 py-10 flex flex-col bg-[#F8FAFC] custom-scrollbar"
              >
                {loadingHistory ? (
                  <div className="flex-grow flex items-center justify-center">
                    <div className="flex space-x-2">
                      <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                    </div>
                  </div>
                ) : messageHistory.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-10">
                    <div className="w-24 h-24 bg-white rounded-[40px] shadow-2xl flex items-center justify-center mb-8 rotate-3">
                      <svg className="w-10 h-10 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Start the vibe!</h3>
                    <p className="text-gray-400 max-w-[200px] mt-2 font-medium">Say hello to {activeConversation.withUser.name.split(' ')[0]} and get things moving.</p>
                  </div>
                ) : (
                  <div className="flex flex-col min-h-full">
                    <div className="flex-grow" />
                    {messageHistory.map((msg, idx) => {
                      const isMe = msg.isMine;
                      return (
                        <div
                          key={msg._id || idx}
                          className={`flex ${isMe ? "justify-end" : "justify-start"} mb-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                          <div className={`group relative max-w-[85%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div
                              className={`px-5 py-3.5 rounded-3xl shadow-sm leading-relaxed text-[15px] font-medium tracking-tight ${
                                isMe
                                  ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-br-none shadow-blue-200"
                                  : "bg-white text-gray-800 rounded-bl-none border border-slate-100 shadow-slate-200"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                            <span className="text-[9px] mt-1.5 text-gray-400 font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} className="h-4" />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-20">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3 bg-slate-50 p-2 rounded-3xl border border-slate-200 group transition-all focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-400 focus-within:bg-white">
                  <input
                    type="text"
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    placeholder="Message your peer..."
                    className="flex-1 bg-transparent px-5 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none font-medium tracking-tight"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessageContent.trim()}
                    className={`p-4 rounded-2xl transition-all duration-500 transform active:scale-90 flex items-center justify-center ${
                      sendingMessage || !newMessageContent.trim()
                        ? "text-gray-300 cursor-not-allowed"
                        : "bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700 hover:rotate-12"
                    }`}
                  >
                    <svg className={`w-5 h-5 ${sendingMessage ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC]">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-100 rounded-full scale-150 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative w-40 h-40 bg-white rounded-[50px] shadow-2xl flex items-center justify-center animate-bounce duration-[2000ms] border-b-8 border-r-8 border-gray-50 overflow-hidden">
                   <div className="absolute top-0 right-0 p-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full opacity-10 blur-xl"></div>
                   </div>
                  <svg className="w-20 h-20 text-blue-500 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-4xl font-black text-gray-900 mt-16 mb-4 tracking-tighter">Your Workspace</h2>
              <p className="text-slate-400 max-w-[280px] text-center font-bold text-lg leading-relaxed">
                Connect. Collaborate. Create. <br/>
                <span className="text-blue-500 opacity-60">Pick a chat to begin.</span>
              </p>
              <button 
                onClick={() => setShowComposeModal(true)}
                className="mt-12 px-10 py-4 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-100 hover:shadow-blue-200 hover:-translate-y-2 active:translate-y-0 transition-all tracking-tight"
              >
                Send first message
              </button>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}} />
    </div>
  );
}

export default MessagesPage;
