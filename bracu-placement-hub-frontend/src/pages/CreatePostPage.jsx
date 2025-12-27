// src/pages/CreatePostPage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function CreatePostPage() {
  const navigate = useNavigate();
  const [postData, setPostData] = useState({
    title: "",
    content: "",
    category: "General Discussion",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "General Discussion", "Interview Tips", "Job Seeking", 
    "Career Advice", "Networking", "Company Reviews"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPostData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !postData.tags.includes(newTag)) {
      setPostData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }));
    }
    setTagInput(""); // Clear input after adding
  };

  const handleRemoveTag = (tagToRemove) => {
    setPostData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postData.title || !postData.content) {
      setError("Title and Content are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:1350/api/forum/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create post.");

      alert("Post created successfully!");
      navigate("/forum");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Create New Post</h1>
            <button onClick={() => navigate("/forum")} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold">
              Cancel
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Title *</label>
              <input type="text" name="title" value={postData.title} onChange={handleInputChange} className="w-full p-3 border rounded-md" required />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Category *</label>
              <select name="category" value={postData.category} onChange={handleInputChange} className="w-full p-3 border rounded-md">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Content *</label>
              <textarea name="content" value={postData.content} onChange={handleInputChange} rows="8" className="w-full p-3 border rounded-md" required></textarea>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Tags (Optional)</label>
              <div className="flex gap-2">
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tags (e.g., interview, tips)" className="flex-grow p-3 border rounded-md" />
                <button type="button" onClick={handleAddTag} className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold">Add</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {postData.tags.map(tag => (
                  <div key={tag} className="bg-gray-200 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-red-600 font-bold">×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-3 rounded-md hover:bg-green-700 transition disabled:bg-gray-400">
                {isSubmitting ? "Publishing..." : "Publish Post"}
              </button>
              <button type="button" onClick={() => navigate("/forum")} className="w-full bg-gray-300 text-gray-800 font-bold py-3 rounded-md hover:bg-gray-400 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreatePostPage;