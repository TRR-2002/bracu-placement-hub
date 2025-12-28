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
              {localStorage.getItem("mongoId") === post.author?._id && (
                <button
                  onClick={handleDeletePost}
                  className="text-red-600 hover:text-red-800 text-sm font-bold flex items-center gap-1"
                >
                  🗑️ Delete Post
                </button>
              )}
            </div>
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
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="ml-auto text-red-500 hover:text-red-700 text-xs font-semibold"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
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
