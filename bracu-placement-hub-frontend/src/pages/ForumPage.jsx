// src/pages/ForumPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function ForumPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- NEW: State for new filters ---
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Latest");

  const categories = [
    "All",
    "Interview Tips",
    "Job Seeking",
    "Career Advice",
    "Networking",
    "General Discussion",
    "Company Reviews",
  ];
  const sortOptions = ["Latest", "Most Liked", "Most Viewed"];

  // Fetch posts whenever filters change
  useEffect(() => {
    fetchPosts();
  }, [category, sortBy]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // --- MODIFIED: Build a dynamic URL with query parameters ---
      const params = new URLSearchParams({
        category: category,
        sortBy: sortBy,
        search: searchQuery,
      });

      const response = await fetch(
        `http://localhost:1350/api/forum/posts?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch posts");
      }
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPosts(); // Trigger fetch with the current searchQuery
  };

  // --- REMOVED: All state and handlers for the modal (showCreatePost, postData, handleCreatePost) ---

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* --- Header --- */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800">
              Community Forum
            </h1>
            <p className="text-gray-600 mt-1">
              Share experiences, ask questions, and connect with peers
            </p>
          </div>

          {/* --- NEW: Search and Filter Bar --- */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 sticky top-20 z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <form
                onSubmit={handleSearchSubmit}
                className="md:col-span-2 flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Search posts by title, content, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold"
                >
                  Search
                </button>
              </form>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {sortOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={() => navigate("/forum/create")}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition"
            >
              + New Post
            </button>
          </div>

          {/* --- Posts List --- */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">Loading posts...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-md">
              {error}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow-md text-center">
              <p className="text-xl text-gray-600">
                No posts found for your criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  to={`/forum/posts/${post._id}`}
                  key={post._id}
                  className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {post.title}
                      </h2>
                      <p className="text-sm text-gray-600">
                        By {post.author?.name || "Unknown"} •{" "}
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 my-3">
                    {post.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500 mt-4">
                    <span>
                      ❤️ {post.likes?.length || post.likesCount || 0} Likes
                    </span>
                    <span>💬 {post.comments?.length || 0} Comments</span>
                    <span>👁️ {post.views || 0} Views</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ForumPage;
