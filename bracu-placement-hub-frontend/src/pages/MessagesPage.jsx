import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";  // ← ADD THIS


function MessagesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inbox"); // inbox or sent
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageError, setMessageError] = useState("");
  
  // Compose form
  const [composeData, setComposeData] = useState({
    recipientId: "",
    recipientEmail: "",
    subject: "",
    content: "",
  });

  useEffect(() => {
    fetchMessages();
  }, [activeTab]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const endpoint =
        activeTab === "inbox"
          ? "http://localhost:1350/api/messages/inbox"
          : "http://localhost:1350/api/messages/sent";

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch messages");
      }

      setMessages(data.messages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
      // 1. Clean the input (Remove spaces and lowercase)
    const cleanEmail = composeData.recipientEmail.trim().toLowerCase();
    
    //if (!composeData.recipientEmail || !composeData.content) {
    if (!cleanEmail || !composeData.content) {  
    alert("Please fill in recipient email and message content");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      // First, find user by email
      //const usersResponse = await fetch(
      //http://localhost:1350/api/admin/users?search=${composeData.recipientEmail}`,
      const response = await fetch("http://localhost:1350/api/messages/send", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
        },
          body: JSON.stringify({
          // Send email instead of recipientId. 
          // Ensure your Backend Controller can handle 'recipientEmail' or 'email' in the body.
          recipientEmail: cleanEmail, 
          subject: composeData.subject,
          content: composeData.content
        }),
      });
      
      const data = await response.json();
      //const recipient = usersData.users?.find(u => u.email === composeData.recipientEmail);
      
      if (!response.ok) {
         throw new Error(data.error || "Failed to send message");
        //alert("User not found with this email");
        //return;
      }

      alert("Message sent successfully!");
      setShowCompose(false);
      setComposeData({
        recipientId: "",
        recipientEmail: "",
        subject: "",
        content: "",
      });
      setActiveTab("sent");
      fetchMessages();
    } catch (err) {
      //console.error(err);
      alert(err.message);
    }
  };

      /*const response = await fetch("http://localhost:1350/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: recipient._id,
          subject: composeData.subject,
          content: composeData.content,
        }),
      });
  */
      /*const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      alert("Message sent successfully!");
      setShowCompose(false);
      setComposeData({
        recipientId: "",
        recipientEmail: "",
        subject: "",
        content: "",
      });
      setActiveTab("sent");
      fetchMessages();
    } catch (err) {
      alert(err.message);
    }
  };
  */

  const handleViewMessage = async (messageId) => {
    try {
      setMessageError("");
      
      if (!messageId) {
        setMessageError("Invalid message ID");
        return;
      }
      
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/messages/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load message");
      }

      setSelectedMessage(data.message);
    } catch (err) {
      setMessageError(err.message || "Failed to load message");
      setSelectedMessage(null);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/messages/${messageId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete message");
      }

      alert("Message deleted successfully");
      setSelectedMessage(null);
      fetchMessages();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && !selectedMessage && !showCompose) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading messages...</p>
      </div>
    );
  }

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              💬 Messages
            </h1>
            <p className="text-gray-600">Direct messaging with other users</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCompose(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition"
            >
              ✉️ Compose
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 font-semibold transition"
            >
              Back
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => {
                    setActiveTab("inbox");
                    setSelectedMessage(null);
                  }}
                  className={`flex-1 py-4 px-6 font-semibold transition ${
                    activeTab === "inbox"
                      ? "bg-blue-50 border-b-4 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  📥 Inbox ({messages.filter(m => !m.read).length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab("sent");
                    setSelectedMessage(null);
                  }}
                  className={`flex-1 py-4 px-6 font-semibold transition ${
                    activeTab === "sent"
                      ? "bg-blue-50 border-b-4 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  📤 Sent
                </button>
              </div>

              {/* Message List */}
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No messages in {activeTab}</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      onClick={() => handleViewMessage(message._id)}
                      className={`p-4 cursor-pointer transition ${
                        selectedMessage?._id === message._id
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      } ${!message.read && activeTab === "inbox" ? "bg-blue-50/50" : ""}`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold text-gray-800 truncate flex-1">
                          {activeTab === "inbox"
                            ? message.sender?.name || "Unknown"
                            : message.recipient?.name || "Unknown"}
                        </p>
                        {!message.read && activeTab === "inbox" && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700 truncate mb-1">
                        {message.subject || "(No subject)"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {message.content?.substring(0, 50)}...
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Message Detail / Compose */}
          <div className="lg:col-span-2">
            {showCompose ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Compose Message</h2>
                  <button
                    onClick={() => setShowCompose(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSendMessage}>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">
                      To (Email) *
                    </label>
                    <input
                      type="email"
                      value={composeData.recipientEmail}
                      onChange={(e) =>
                        setComposeData({
                          ...composeData,
                          recipientEmail: e.target.value,
                        })
                      }
                      placeholder="recipient@example.com"
                      className="w-full p-3 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={composeData.subject}
                      onChange={(e) =>
                        setComposeData({ ...composeData, subject: e.target.value })
                      }
                      placeholder="Message subject"
                      className="w-full p-3 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 font-bold mb-2">
                      Message *
                    </label>
                    <textarea
                      value={composeData.content}
                      onChange={(e) =>
                        setComposeData({ ...composeData, content: e.target.value })
                      }
                      placeholder="Type your message here..."
                      rows="10"
                      className="w-full p-3 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                    >
                      Send Message
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCompose(false)}
                      className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : messageError ? (
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="text-center">
                  <p className="text-lg text-red-600 font-semibold mb-4">⚠️ {messageError}</p>
                  <button
                    onClick={() => {
                      setMessageError("");
                      setSelectedMessage(null);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Back to Messages
                  </button>
                </div>
              </div>
            ) : selectedMessage ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {selectedMessage.subject || "(No subject)"}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <p>
                        <span className="font-semibold">From:</span>{" "}
                        {selectedMessage.sender?.name} ({selectedMessage.sender?.email})
                      </p>
                      <p>
                        <span className="font-semibold">To:</span>{" "}
                        {selectedMessage.recipient?.name} ({selectedMessage.recipient?.email})
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteMessage(selectedMessage._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
                  >
                    Delete
                  </button>
                </div>

                <div className="border-t pt-6">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.content}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={() => {
                      setComposeData({
                        recipientId: selectedMessage.sender?._id,
                        recipientEmail: selectedMessage.sender?.email,
                        subject: `Re: ${selectedMessage.subject || "(No subject)"}`,
                        content: "",
                      });
                      setShowCompose(true);
                      setSelectedMessage(null);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                  >
                    Reply
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg
                  className="w-24 h-24 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-xl text-gray-600">Select a message to read</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default MessagesPage;
