// src/pages/ForumPostDetail.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function ForumPostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostData, setEditPostData] = useState({ title: "", content: "", category: "" });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  const categories = [
    "Interview Tips",
    "Job Seeking",
    "Career Advice",
    "Networking",
    "General Discussion",
    "Company Reviews",
  ];

  // This function ONLY fetches data, it does not change it.
  const fetchPostWithComments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/forum/posts/${postId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load post");
      }
      setPost(data.post);
      setComments(data.comments);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // Step 1: Increment the view count. We do this once on initial load.
        // This is a "fire-and-forget" request; we don't need its response.
        fetch(`http://localhost:1350/api/forum/posts/${postId}/view`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        // Step 2: Fetch the post and comment data to display.
        const response = await fetch(
          `http://localhost:1350/api/forum/posts/${postId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load post data.");
        }
        setPost(data.post);
        setComments(data.comments);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [postId, navigate]);

  const handleLikePost = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:1350/api/forum/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPostWithComments(); // Refresh data without incrementing view count
    } catch (err) {
      alert("Failed to like post.");
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `http://localhost:1350/api/forum/comments/${commentId}/like`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchPostWithComments(); // Refresh data without incrementing view count
    } catch (err) {
      alert("Failed to like comment.");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/forum/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: commentText }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to post comment");
      }
      setCommentText("");
      fetchPostWithComments(); // Refresh data without incrementing view count
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post? This will also delete all comments.")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:1350/api/forum/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete post");
      }
      navigate("/forum");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:1350/api/forum/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete comment");
      }
      fetchPostWithComments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditPost = () => {
    setEditPostData({
      title: post.title,
      content: post.content,
      category: post.category
    });
    setIsEditingPost(true);
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:1350/api/forum/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editPostData)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update post");
      }
      setIsEditingPost(false);
      fetchPostWithComments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditCommentText(comment.content);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:1350/api/forum/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: editCommentText })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update comment");
      }
      setEditingCommentId(null);
      fetchPostWithComments();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-red-600 mb-4 text-lg">
              {error || "Post not found"}
            </p>
            <button
              onClick={() => navigate("/forum")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Forum
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/forum")}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← Back to Forum
          </button>

          {/* Post Card */}
          <div className="bg-white p-8 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {post.category}
                </span>
                {post.flagged && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                    Flagged
                  </span>
                )}
              </div>
              {localStorage.getItem("mongoId") === post.author?._id && !isEditingPost && (
                <div className="flex gap-4">
                  <button
                    onClick={handleEditPost}
                    className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1"
                  >
                    ✏️ Edit Post
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="text-red-600 hover:text-red-800 text-sm font-bold flex items-center gap-1"
                  >
                    🗑️ Delete Post
                  </button>
                </div>
              )}
            </div>

            {isEditingPost ? (
              <form onSubmit={handleUpdatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editPostData.title}
                    onChange={(e) => setEditPostData({ ...editPostData, title: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editPostData.category}
                    onChange={(e) => setEditPostData({ ...editPostData, category: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={editPostData.content}
                    onChange={(e) => setEditPostData({ ...editPostData, content: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    rows="8"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPost(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  {post.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                  <span>by {post.author?.name || "Anonymous"}</span>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                  {post.content}
                </p>
              </>
            )}
            <div className="flex items-center gap-6 pt-4 border-t text-gray-600">
              <button
                onClick={handleLikePost}
                className="flex items-center gap-2 hover:text-red-600 transition-colors"
              >
                ❤️ {post.likes?.length || 0} Likes
              </button>
              <span>💬 {comments.length} Comments</span>
              {/* The view count can now be safely displayed */}
              <span>👁️ {post.views || 0} Views</span>
            </div>
          </div>

          {/* Comment Form */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Add a Comment
            </h2>
            <form onSubmit={handleCommentSubmit}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-md mb-3"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
              >
                Post Comment
              </button>
            </form>
          </div>

          {/* Comments List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Comments ({comments.length})
            </h2>
            {comments.length === 0 ? (
              <p className="text-center text-gray-600 py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="border-b pb-4 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-gray-800">
                        {comment.author?.name || "Anonymous"}
                      </p>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {comment.flagged && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                          Flagged
                        </span>
                      )}
                      {localStorage.getItem("mongoId") === comment.author?._id && (
                        <div className="ml-auto flex gap-3">
                          <button
                            onClick={() => handleEditComment(comment)}
                            className="text-blue-500 hover:text-blue-700 text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    {editingCommentId === comment._id ? (
                      <div className="space-y-2 mt-2">
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          rows="3"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateComment(comment._id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 mt-1">{comment.content}</p>
                    )}
                    <div className="mt-2">
                      <button
                        onClick={() => handleLikeComment(comment._id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                      >
                        ❤️ {comment.likes?.length || 0} Likes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ForumPostDetail;
