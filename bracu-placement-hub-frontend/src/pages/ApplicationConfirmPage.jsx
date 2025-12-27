import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJobDetails, applyToJob } from "../api/jobApi";
import Navbar from "../components/Navbar";  // ← ADD THIS


function ApplicationConfirmPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch job details
      const jobData = await getJobDetails(jobId);
      setJob(jobData.job);

      // Check if already applied
      if (jobData.hasApplied) {
        alert("You have already applied to this job!");
        navigate(`/jobs/${jobId}`);
        return;
      }

      // Fetch user profile
      const token = localStorage.getItem("token");
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
      setProfile(profileData.user);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.error || "Failed to load application data.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmApplication = async () => {
    try {
      setSubmitting(true);
      setError("");

      await applyToJob(jobId);

      // Navigate to success page
      navigate(`/jobs/${jobId}/application-success`);
    } catch (err) {
      console.error("Error submitting application:", err);
      setError(err.error || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/jobs/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading application form...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(`/jobs/${jobId}`)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Job Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <Navbar />
    
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Confirm Your Application
          </h1>
          <p className="text-gray-600">
            Review your profile information before submitting your application
          </p>
        </div>

        {/* Job Info Card */}
        {job && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Applying for:
            </h2>
            <p className="text-2xl font-bold text-blue-600">{job.title}</p>
            <p className="text-lg text-gray-700">{job.company}</p>
            {job.location && (
              <p className="text-gray-600 mt-2">📍 {job.location}</p>
            )}
          </div>
        )}

        {/* Profile Snapshot Card */}
        {profile && (
          <div className="bg-white p-8 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Your Profile Snapshot
            </h2>

            {/* Basic Info */}
            <div className="mb-6 pb-6 border-b">
              <h3 className="text-lg font-bold text-gray-700 mb-3">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{profile.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{profile.email}</p>
                </div>
                {profile.studentId && (
                  <div>
                    <p className="text-sm text-gray-600">Student ID</p>
                    <p className="font-semibold">{profile.studentId}</p>
                  </div>
                )}
                {profile.department && (
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-semibold">{profile.department}</p>
                  </div>
                )}
                {profile.cgpa && (
                  <div>
                    <p className="text-sm text-gray-600">CGPA</p>
                    <p className="font-semibold">{profile.cgpa}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-lg font-bold text-gray-700 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-lg font-bold text-gray-700 mb-3">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Work Experience */}
            {profile.workExperience && profile.workExperience.length > 0 && (
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-lg font-bold text-gray-700 mb-3">
                  Work Experience
                </h3>
                <div className="space-y-3">
                  {profile.workExperience.map((exp, index) => (
                    <div
                      key={index}
                      className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                    >
                      <p className="font-semibold text-gray-800">
                        {exp.position}
                      </p>
                      <p className="text-gray-700">{exp.company}</p>
                      <p className="text-sm text-purple-700">{exp.duration}</p>
                      {exp.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-700 mb-3">
                  Education
                </h3>
                <div className="space-y-3">
                  {profile.education.map((edu, index) => (
                    <div
                      key={index}
                      className="p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <p className="font-semibold text-gray-800">
                        {edu.degree}
                      </p>
                      <p className="text-gray-700">{edu.institution}</p>
                      <p className="text-sm text-green-700">{edu.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Confirmation Notice */}
        <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-yellow-800 mb-1">
                Important Notice
              </p>
              <p className="text-yellow-700 text-sm">
                The profile information shown above will be submitted with your
                application. Make sure your profile is up-to-date before
                confirming.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleConfirmApplication}
            disabled={submitting}
            className={`flex-1 px-6 py-3 rounded-md font-bold text-lg transition ${
              submitting
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {submitting ? "Submitting..." : "Confirm & Submit Application"}
          </button>
          <button
            onClick={handleCancel}
            disabled={submitting}
            className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-bold text-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Edit Profile Link */}
        <div className="mt-4 text-center">
          <button
            onClick={() =>
              navigate(`/profile/edit`, {
                state: { returnTo: `/jobs/${jobId}/apply` },
              })
            }
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Need to update your profile? Click here to edit
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

export default ApplicationConfirmPage;
