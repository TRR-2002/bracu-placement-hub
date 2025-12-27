// src/pages/EditCompanyProfilePage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function EditCompanyProfilePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    companyIndustry: "",
    companyDescription: "",
    companyLocation: "",
    companySize: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        // Fetch the user's own profile which contains company data for recruiters
        const response = await fetch("http://localhost:1350/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error("Failed to fetch profile");

        if (data.user.role !== "recruiter") {
          alert("Access Denied: Only recruiters can edit a company profile.");
          navigate("/");
          return;
        }

        setFormData({
          companyName: data.user.companyName || "",
          companyIndustry: data.user.companyIndustry || "",
          companyDescription: data.user.companyDescription || "",
          companyLocation: data.user.companyLocation || "",
          companySize: data.user.companySize || "",
        });
      } catch (err) {
        setError("Failed to load your company profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      if (!response.ok)
        throw new Error(data.error || "Failed to update profile.");
      alert("Company profile updated successfully!");
      navigate("/recruiter/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Edit Company Profile
          </h1>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields are identical to CreateCompanyProfilePage */}
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
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/recruiter/dashboard")}
                className="w-full bg-gray-300 text-gray-800 font-bold py-3 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default EditCompanyProfilePage;
