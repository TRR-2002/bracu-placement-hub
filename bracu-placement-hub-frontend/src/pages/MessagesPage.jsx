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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">New Message</h2>
        <form onSubmit={handleStartChat}>
          <label className="block text-gray-700 font-semibold mb-2">
            To (User's Email):
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-md font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-md font-semibold transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
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

  // Get logged in user info
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  // Helper to parse location state and query params
  const useQuery = () => {
    return new URLSearchParams(window.location.search);
  };
  const query = useQuery();
  const targetUserId = query.get("userId");
  const location = useLocation(); // Need to import this
  const stateSelectedUser = location.state?.selectedUser;

  // Fetch conversations list
  const fetchConversations = async () => {
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

        // If specific user targeted via URL
        if (targetUserId) {
          // 1. Check if conversation already exists
          const existingConvo = _conversations.find(
            (c) => c.withUser?._id === targetUserId
          );
          if (existingConvo) {
            setActiveConversation(existingConvo);
          } 
          // 2. If not, but we have user details passed from dashboard, create temp conversation
          else if (stateSelectedUser && stateSelectedUser._id === targetUserId) {
             setActiveConversation({
               withUser: stateSelectedUser,
               lastMessage: null,
               unreadCount: 0
             });
          }
          // 3. Fallback: If we assume they exist but have no details, we might fail or need a fetch.
          // For now, let's rely on dashboard passing state.
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to load conversations.");
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchUserInfoAndStart = async (uid) => {
    try {
       // We need an endpoint to get user by ID to start a fresh chat UI
       // Assuming /api/users/<id> exists or similar. If not, we might need to rely on the compose modal logic
       // For now, let's look for a generic user fetch or just show error if not found.
       // Actually, we can use the Profile endpoint or search endpoint if available.
       // Let's reuse the find-by-email logic but for ID if possible, BUT easier:
       // Just set active conversation with minimal info if we can't fetch full details,
       // Or better, let's verify if we can fetch user details.
       // Looking at server.js, there isn't a direct "get user by id" public endpoint exposed easily in what I read.
       // Wait, I saw `app.get("/api/users/find-by-email", ...)`
       // Let's assume for now if it's not in the list, we might have to just open the compose modal?
       // No, that interrupts flow.
       // Let's try to simulate a new conversation object if we assume the user exists.
    } catch(e) { console.error(e) }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchConversations();

    // Poll every 10 seconds for new messages
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [token, navigate]);

  // Fetch message history when conversation changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!activeConversation || !activeConversation.withUser) return;

      setLoadingHistory(true);
      setMessageHistory([]);
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
  }, [activeConversation, token]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageHistory]);

  // Handle sending a message
  // src/pages/MessagesPage.jsx

  // Handle sending a message
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

    // Optimistic UI update with the 'isMine' flag
    const optimisticMessage = {
      _id: tempMessageId,
      content: messageContent,
      createdAt: new Date().toISOString(),
      isMine: true, // <-- FIX 1: Manually set the flag for instant correct alignment
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

      // Replace temporary message with the real one from the server
      if (data.success && data.messageData) {
        // --- FIX 2: Add the 'isMine' flag to the server response ---
        const realMessage = { ...data.messageData, isMine: true };

        setMessageHistory((prev) =>
          prev.map((msg) => (msg._id === tempMessageId ? realMessage : msg))
        );
      }

      // Refresh conversations to update preview and order
      fetchConversations();
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");

      // On failure, remove the optimistic message
      setMessageHistory((prev) =>
        prev.filter((msg) => msg._id !== tempMessageId)
      );
      // Restore the typed message so the user doesn't lose it
      setNewMessageContent(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="h-screen w-screen flex flex-col bg-gray-100">
        {/* Compose Modal */}
        {showComposeModal && (
          <ComposeModal
            onClose={() => setShowComposeModal(false)}
            onConversationStart={(convo) => {
              setActiveConversation(convo);
              setShowComposeModal(false);
            }}
          />
        )}

        {/* Main Container */}
        <div className="flex-grow flex h-[calc(100vh-4rem)] overflow-hidden">
          {/* LEFT SIDEBAR - Conversation List */}
          <div className="w-full md:w-1/3 border-r bg-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-800">Messages</h1>
              <button
                onClick={() => setShowComposeModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 transition"
              >
                + New
              </button>
            </div>

            {/* Conversations List - ONLY THIS SCROLLS */}
            <div className="flex-grow overflow-y-auto">
              {loadingConversations ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading conversations...</p>
                </div>
              ) : error && conversations.length === 0 ? (
                <div className="p-8 text-center text-red-600">
                  <p>{error}</p>
                  <button
                    onClick={fetchConversations}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
                  >
                    Retry
                  </button>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="font-semibold mb-2">No messages yet</p>
                  <p className="text-sm">Click "New" to start a conversation</p>
                </div>
              ) : (
                conversations
                .filter(convo => convo && convo.withUser) // <-- ADD THIS SAFETY 
                .map((convo) => (
                  <div
                    key={convo.withUser._id}
                    onClick={() => setActiveConversation(convo)}
                    className={`p-4 cursor-pointer border-l-4 transition ${
                      activeConversation?.withUser?._id === convo.withUser._id
                        ? "bg-blue-50 border-blue-500"
                        : "hover:bg-gray-50 border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-gray-800">
                        {convo.withUser.name}
                      </p>
                      {convo.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {convo.lastMessage?.content || "No messages yet"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {convo.lastMessage?.createdAt
                        ? formatTimeAgo(convo.lastMessage.createdAt)
                        : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT PANEL - Chat Window */}
          <div className="w-full md:w-2/3 flex flex-col bg-gray-50">
            {activeConversation && activeConversation.withUser ? (
              <>
                {/* Chat Header - FIXED */}
                <div className="p-4 border-b bg-white shadow-sm flex-shrink-0">
                  <h2 className="text-lg font-bold text-gray-800">
                    {activeConversation.withUser.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {activeConversation.withUser.email}
                    {activeConversation.withUser.role && (
                      <span className="capitalize">
                        {" "}
                        • {activeConversation.withUser.role}
                      </span>
                    )}
                  </p>
                </div>

                {/* Messages Area - ONLY THIS SCROLLS */}
                <div className="flex-grow p-6 overflow-y-auto bg-gray-50">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : messageHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <p className="text-lg font-semibold mb-2">
                          No messages yet
                        </p>
                        <p className="text-sm">
                          Start the conversation by sending a message below
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messageHistory.map((msg, idx) => {
                        // Compare sender with current userId
                        const isMyMessage = msg.isMine;

                        return (
                          <div
                            key={msg._id || idx}
                            className={`flex ${
                              isMyMessage ? "justify-end" : "justify-start"
                            } mb-4`}
                          >
                            <div
                              className={`max-w-md p-3 rounded-xl shadow-sm ${
                                isMyMessage
                                  ? "bg-blue-600 text-white rounded-br-none"
                                  : "bg-white text-gray-800 rounded-bl-none"
                              }`}
                            >
                              <p className="break-words">{msg.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isMyMessage
                                    ? "text-right text-blue-100"
                                    : "text-left text-gray-400"
                                }`}
                              >
                                {formatMessageTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input - FIXED */}
                <div className="p-4 bg-white border-t flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessageContent}
                      onChange={(e) => setNewMessageContent(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-grow p-3 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={sendingMessage}
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessageContent.trim()}
                      className={`px-6 py-2 rounded-full font-semibold transition ${
                        sendingMessage || !newMessageContent.trim()
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {sendingMessage ? "Sending..." : "Send"}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center text-center text-gray-500 p-8">
                <div>
                  <svg
                    className="w-24 h-24 mx-auto mb-4 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <h2 className="text-xl font-bold mb-2">
                    Select a conversation
                  </h2>
                  <p className="text-gray-400">
                    Choose an existing conversation or start a new one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default MessagesPage;
