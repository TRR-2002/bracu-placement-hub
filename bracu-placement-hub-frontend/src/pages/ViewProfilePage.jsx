import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ViewProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to view profiles");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const response = await fetch(
        `http://localhost:1350/api/profile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
      } else {
        throw new Error("Profile data not found in response");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white shadow-md rounded-lg">
          <p className="text-red-600 text-xl mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Profile not found.</p>
      </div>
    );
  }

  const loggedInUserId = localStorage.getItem("userId");
  const isOwnProfile = loggedInUserId === profile.userId;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {profile.name}
              </h1>
              <p className="text-lg text-gray-600 mt-1">{profile.email}</p>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => navigate("/profile/edit")}
                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <span>✏️</span> Edit Profile
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t pt-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Department
              </h3>
              <p className="text-lg text-gray-800">
                {profile.department || "N/A"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                User ID
              </h3>
              <p className="text-lg text-gray-800">{profile.userId || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Student ID
              </h3>
              <p className="text-lg text-gray-800">
                {profile.studentId || "N/A"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                CGPA
              </h3>
              <p className="text-lg text-gray-800">{profile.cgpa || "N/A"}</p>
            </div>
            {/* Phone Number Section Removed */}
          </div>
        </div>

        {/* Skills Section */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-3">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interests Section - FIXED */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Interests</h2>
            <div className="flex flex-wrap gap-3">
              {profile.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Work Experience Section - FIXED */}
        {profile.workExperience && profile.workExperience.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Work Experience
            </h2>
            <div className="space-y-6">
              {profile.workExperience.map((exp, index) => (
                <div key={index} className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {exp.position}
                  </h3>
                  <p className="text-md text-gray-700 font-medium">
                    {exp.company}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{exp.duration}</p>
                  {exp.description && (
                    <p className="text-gray-600 mt-2">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Section */}
        {profile.education && profile.education.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Education</h2>
            <div className="space-y-6">
              {profile.education.map((edu, index) => (
                <div key={index} className="border-l-4 border-cyan-500 pl-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {edu.degree}
                  </h3>
                  <p className="text-md text-gray-700 font-medium">
                    {edu.institution}
                  </p>
                  {/* FIXED: Display correct end year */}
                  <p className="text-sm text-gray-500 mt-1">
                    {edu.year || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewProfilePage;
