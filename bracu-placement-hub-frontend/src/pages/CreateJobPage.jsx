// src/pages/CreateJobPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // ← ADD THIS

function CreateJobPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    latitude: "",
    longitude: "",
    salaryMin: "",
    salaryMax: "",
    description: "",
    requiredSkills: [],
    type: "Full-time",
    applicationDeadline: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Verify user is a recruiter and fetch their company name
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:1350/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user.role !== "recruiter") {
          navigate("/");
        }
        // --- THIS IS THE ADDED LOGIC ---
        // Auto-fill the company name from the recruiter's profile
        if (data.user.companyName) {
          setFormData((prev) => ({ ...prev, company: data.user.companyName }));
        }
        // --- END OF ADDED LOGIC ---
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSkill = () => {
    if (
      skillInput.trim() &&
      !formData.requiredSkills.includes(skillInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(
        (skill) => skill !== skillToRemove
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.title || !formData.company || !formData.description) {
      setError(
        "Please fill in all required fields (Title, Company, Description)"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      // Prepare job data
      const jobData = {
        title: formData.title,
        company: formData.company,
        location: formData.location || undefined,
        coordinates:
          formData.latitude && formData.longitude
            ? {
                lat: parseFloat(formData.latitude),
                lng: parseFloat(formData.longitude),
              }
            : undefined,
        salaryMin: formData.salaryMin
          ? parseInt(formData.salaryMin)
          : undefined,
        salaryMax: formData.salaryMax
          ? parseInt(formData.salaryMax)
          : undefined,
        description: formData.description,
        requiredSkills: formData.requiredSkills,
        type: formData.type,
        applicationDeadline: formData.applicationDeadline || undefined,
      };

      const response = await fetch("http://localhost:1350/api/recruiter/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create job");
      }

      alert("Job posted successfully!");
      navigate("/recruiter/dashboard");
    } catch (err) {
      console.error("Error creating job:", err);
      setError(err.message || "Failed to create job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">
              Create New Job Posting
            </h1>
            <button
              onClick={() => navigate("/recruiter/dashboard")}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold transition"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Form */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Job Title */}
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* --- MODIFIED COMPANY INPUT --- */}
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  required
                  readOnly // Use readOnly instead of disabled to ensure value is submitted with the form
                />
              </div>

              {/* Job Type */}
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Job Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              {/* Location */}
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Dhaka, Bangladesh"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Coordinates (Optional) */}
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Coordinates (Optional - for map display)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="Latitude (e.g., 23.8103)"
                    step="any"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="Longitude (e.g., 90.4125)"
                    step="any"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Tip: Add coordinates to show job location on an interactive
                  map
                </p>
              </div>

              {/* Salary Range */}
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Salary Range (BDT)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    name="salaryMin"
                    value={formData.salaryMin}
                    onChange={handleInputChange}
                    placeholder="Min (e.g., 30000)"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    name="salaryMax"
                    value={formData.salaryMax}
                    onChange={handleInputChange}
                    placeholder="Max (e.g., 50000)"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Application Deadline */}
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Application Deadline 📅
                </label>
                <input
                  type="datetime-local"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Set a deadline for applications. This will be automatically
                  added to all students' Google Calendar.
                </p>
              </div>

              {/* Job Description */}
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Job Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the role, responsibilities, requirements, etc."
                  rows="6"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Required Skills */}
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">
                  Required Skills
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Add a skill (e.g., JavaScript, Project Management)"
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 font-bold py-3 rounded-md transition ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {isSubmitting ? "Creating Job..." : "Post Job"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/recruiter/dashboard")}
                  className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateJobPage;
