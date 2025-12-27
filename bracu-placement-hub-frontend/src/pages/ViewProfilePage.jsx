import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";  // ← ADD THIS


function ViewProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await fetch("http://localhost:1350/api/auth/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">No user data found.</p>
      </div>
    );
  }

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Basic Info */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="text-lg font-semibold">{user.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="text-lg font-semibold">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-600">User ID</p>
              <p className="text-lg font-semibold">{user.userId}</p>
            </div>
            <div>
              <p className="text-gray-600">Student ID</p>
              <p className="text-lg font-semibold">{user.studentId || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Academic Info */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Academic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Department</p>
              <p className="text-lg font-semibold">
                {user.department || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-600">CGPA</p>
              <p className="text-lg font-semibold">{user.cgpa || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {user.skills && user.skills.length > 0 ? (
              user.skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-gray-600">No skills added yet.</p>
            )}
          </div>
        </div>

        {/* Interests */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {user.interests && user.interests.length > 0 ? (
              user.interests.map((interest) => (
                <span
                  key={interest}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full"
                >
                  {interest}
                </span>
              ))
            ) : (
              <p className="text-gray-600">No interests added yet.</p>
            )}
          </div>
        </div>

        {/* Work Experience Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Work Experience</h2>
          {user.workExperience && user.workExperience.length > 0 ? (
            <div className="space-y-4">
              {user.workExperience.map((exp, index) => (
                <div
                  key={index}
                  className="p-4 bg-purple-50 rounded-lg border border-purple-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-800">
                        {exp.position}
                      </p>
                      <p className="text-gray-700 font-medium">{exp.company}</p>
                    </div>
                    <span className="text-sm text-purple-700 bg-purple-100 px-3 py-1 rounded-full whitespace-nowrap ml-4">
                      {exp.duration}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 italic">
                No work experience added yet.
              </p>
            </div>
          )}
        </div>

        {/* Education Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Education</h2>
          {user.education && user.education.length > 0 ? (
            <div className="space-y-4">
              {user.education.map((edu, index) => (
                <div
                  key={index}
                  className="p-4 bg-green-50 rounded-lg border border-green-200"
                >
                  <p className="text-lg font-semibold text-gray-800">
                    {edu.degree}
                  </p>
                  <p className="text-gray-700 font-medium mt-1">
                    {edu.institution}
                  </p>
                  <p className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full inline-block mt-2">
                    {edu.year}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 italic">
                No education history added yet.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons - Added Browse Jobs button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <button
            onClick={() => navigate("/profile/edit")}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-lg transition"
          >
            Edit Profile
          </button>
          <button
            onClick={() => navigate("/jobs")}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold text-lg transition"
          >
            Browse Jobs
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 font-semibold text-lg transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

export default ViewProfilePage;
