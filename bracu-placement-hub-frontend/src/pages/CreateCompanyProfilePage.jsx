// src/pages/CreateCompanyProfilePage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function CreateCompanyProfilePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    companyIndustry: "",
    companyDescription: "",
    companyLocation: "",
    companySize: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.companyIndustry) {
      setError("Company Name and Industry are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:1350/api/company/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create profile.");
      }

      alert("Company profile created successfully!");
      navigate("/recruiter/dashboard"); // Redirect to dashboard after success
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Create Your Company Profile
          </h1>
          <p className="text-gray-600 mb-6">
            Complete your company profile to start posting jobs and searching
            for talent.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Industry *
              </label>
              <input
                type="text"
                name="companyIndustry"
                value={formData.companyIndustry}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Location
              </label>
              <input
                type="text"
                name="companyLocation"
                value={formData.companyLocation}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Company Size
              </label>
              <input
                type="text"
                name="companySize"
                value={formData.companySize}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Company Description
              </label>
              <textarea
                name="companyDescription"
                value={formData.companyDescription}
                onChange={handleInputChange}
                rows="4"
                className="w-full p-3 border rounded-md"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {isSubmitting ? "Saving Profile..." : "Save and Continue"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreateCompanyProfilePage;
