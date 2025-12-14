import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function RecruiterDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Fetch user profile to verify role
      const profileResponse = await fetch(
        "http://localhost:1350/api/auth/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch profile");
      }

      const profileData = await profileResponse.json();

      // Verify user is a recruiter
      if (profileData.user.role !== "recruiter") {
        navigate("/"); // Redirect non-recruiters
        return;
      }

      setUserInfo(profileData.user);

      // Fetch recruiter's jobs
      await fetchJobs();
    } catch (err) {
      console.error("Auth check error:", err);
      setError("Authentication failed. Please login again.");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:1350/api/recruiter/jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  const handleCreateJob = () => {
    navigate("/recruiter/jobs/create");
  };

  const handleEditJob = (jobId) => {
    navigate(`/recruiter/jobs/edit/${jobId}`);
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job posting?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/recruiter/jobs/${jobId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      alert("Job deleted successfully!");
      fetchJobs(); // Refresh the list
    } catch (err) {
      console.error("Error deleting job:", err);
      alert("Failed to delete job. Please try again.");
    }
  };

  const handleMarkAsFilled = async (jobId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/recruiter/jobs/${jobId}/mark-filled`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update job status");
      }

      alert("Job marked as filled!");
      fetchJobs(); // Refresh the list
    } catch (err) {
      console.error("Error updating job:", err);
      alert("Failed to update job status. Please try again.");
    }
  };

  const handleViewApplications = (jobId) => {
    navigate(`/recruiter/jobs/${jobId}/applications`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Recruiter Dashboard
              </h1>
              {userInfo && (
                <p className="text-gray-600">Welcome, {userInfo.name}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 font-semibold mb-2">Total Jobs</h3>
            <p className="text-3xl font-bold text-blue-600">{jobs.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 font-semibold mb-2">Open Positions</h3>
            <p className="text-3xl font-bold text-green-600">
              {jobs.filter((job) => job.status === "Open").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 font-semibold mb-2">
              Filled Positions
            </h3>
            <p className="text-3xl font-bold text-gray-600">
              {jobs.filter((job) => job.status === "Filled").length}
            </p>
          </div>
        </div>

        {/* Create New Job Button */}
        <div className="mb-6">
          <button
            onClick={handleCreateJob}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-lg transition"
          >
            + Create New Job Posting
          </button>
        </div>

        {/* Job Listings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              Your Job Postings
            </h2>
          </div>

          {jobs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 text-lg mb-4">
                You haven't posted any jobs yet.
              </p>
              <button
                onClick={handleCreateJob}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
              >
                Create Your First Job Posting
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <div key={job._id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          {job.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            job.status === "Open"
                              ? "bg-green-100 text-green-800"
                              : job.status === "Closed"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{job.company}</p>
                      {job.location && (
                        <p className="text-gray-600 text-sm mb-2">
                          📍 {job.location}
                        </p>
                      )}
                      {job.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {job.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.requiredSkills &&
                          job.requiredSkills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        {job.requiredSkills &&
                          job.requiredSkills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{job.requiredSkills.length - 3} more
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleViewApplications(job._id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-semibold text-sm transition"
                      >
                        View Applications
                      </button>
                      <button
                        onClick={() => handleEditJob(job._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-sm transition"
                      >
                        Edit
                      </button>
                      {job.status === "Open" && (
                        <button
                          onClick={() => handleMarkAsFilled(job._id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold text-sm transition"
                        >
                          Mark as Filled
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteJob(job._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecruiterDashboard;
