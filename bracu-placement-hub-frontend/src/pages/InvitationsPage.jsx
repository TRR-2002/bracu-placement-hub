import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";  // ← ADD THIS


function InvitationsPage() {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Pending"); // Pending, Accepted, Declined, All

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:1350/api/student/invitations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch invitations");
      }

      setInvitations(data.invitations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId, action) => {
    const actionText = action === "accept" ? "accept" : "decline";
    if (!window.confirm(`Are you sure you want to ${actionText} this invitation?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/invitations/${invitationId}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to respond to invitation");
      }

      alert(data.message);
      fetchInvitations(); // Refresh list
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredInvitations = invitations.filter(
    (inv) => filter === "All" || inv.status === filter
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading invitations...</p>
      </div>
    );
  }

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              📧 Job Invitations
            </h1>
            <p className="text-gray-600">
              Recruiters have invited you to apply for these positions
            </p>
          </div>
          <button
            onClick={() => navigate(`/profile/view/${localStorage.getItem("userId")}`)}
            className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 font-semibold transition"
          >
            Back to Profile
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            {["Pending", "Accepted", "Declined", "All"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 py-4 px-6 font-semibold transition ${
                  filter === status
                    ? "border-b-4 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {status}
                <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                  {invitations.filter((inv) => status === "All" || inv.status === status).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 font-semibold mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {invitations.filter((inv) => inv.status === "Pending").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 font-semibold mb-2">Accepted</h3>
            <p className="text-3xl font-bold text-green-600">
              {invitations.filter((inv) => inv.status === "Accepted").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 font-semibold mb-2">Declined</h3>
            <p className="text-3xl font-bold text-red-600">
              {invitations.filter((inv) => inv.status === "Declined").length}
            </p>
          </div>
        </div>

        {/* Invitations List */}
        {filteredInvitations.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <svg
              className="w-24 h-24 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xl text-gray-600 mb-2">
              No {filter.toLowerCase()} invitations
            </p>
            <p className="text-gray-500">
              {filter === "Pending"
                ? "When recruiters invite you to jobs, they'll appear here"
                : `You have no ${filter.toLowerCase()} invitations`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvitations.map((invitation) => (
              <div
                key={invitation._id}
                className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${
                  invitation.status === "Pending"
                    ? "border-yellow-500"
                    : invitation.status === "Accepted"
                    ? "border-green-500"
                    : "border-red-500"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Status Badge */}
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          invitation.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : invitation.status === "Accepted"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {invitation.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Job Info */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {invitation.job?.title || "Job Title"}
                    </h2>
                    <p className="text-lg text-blue-600 font-semibold mb-3">
                      {invitation.job?.company || "Company Name"}
                    </p>

                    {/* Job Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {invitation.job?.location && (
                        <div className="flex items-center text-gray-600">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                          </svg>
                          {invitation.job.location}
                        </div>
                      )}
                      {invitation.job?.type && (
                        <div className="flex items-center text-gray-600">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          {invitation.job.type}
                        </div>
                      )}
                      {(invitation.job?.salaryMin || invitation.job?.salaryMax) && (
                        <div className="flex items-center text-gray-600">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          BDT {invitation.job.salaryMin?.toLocaleString()} -{" "}
                          {invitation.job.salaryMax?.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Recruiter Info */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-gray-600 mb-1">From:</p>
                      <p className="font-semibold text-gray-800">
                        {invitation.recruiter?.name || "Recruiter"}
                      </p>
                      {invitation.recruiter?.companyName && (
                        <p className="text-sm text-gray-600">
                          {invitation.recruiter.companyName}
                        </p>
                      )}
                    </div>

                    {/* Message */}
                    {invitation.message && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-700 italic">
                          "{invitation.message}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {invitation.status === "Pending" && (
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleRespond(invitation._id, "accept")}
                        className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold transition whitespace-nowrap"
                      >
                        ✓ Accept & Apply
                      </button>
                      <button
                        onClick={() => handleRespond(invitation._id, "decline")}
                        className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold transition whitespace-nowrap"
                      >
                        ✗ Decline
                      </button>
                      <button
                        onClick={() => navigate(`/jobs/${invitation.job._id}`)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition whitespace-nowrap"
                      >
                        View Job
                      </button>
                    </div>
                  )}

                  {invitation.status !== "Pending" && (
                    <div className="ml-4">
                      <button
                        onClick={() => navigate(`/jobs/${invitation.job._id}`)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition"
                      >
                        View Job
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default InvitationsPage;
