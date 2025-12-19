import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ApplicationConfirmPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to apply for jobs.");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [jobResponse, profileResponse] = await Promise.all([
        fetch(`http://localhost:1350/api/jobs/${jobId}`, { headers }),
        fetch("http://localhost:1350/api/auth/profile", { headers }),
      ]);

      if (!jobResponse.ok || !profileResponse.ok) {
        throw new Error("Failed to load application data.");
      }

      const jobData = await jobResponse.json();
      const profileData = await profileResponse.json();

      if (jobData.hasApplied) {
        alert("You have already applied to this job!");
        navigate(`/jobs/${jobId}`);
        return;
      }

      setJob(jobData.job);
      setProfile(profileData.user);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load application data.");
    } finally {
      setLoading(false);
    }
  }, [jobId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfirmApplication = async () => {
    try {
      setSubmitting(true);
      setError("");
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:1350/api/jobs/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId: jobId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application.");
      }

      navigate(`/jobs/${jobId}/application-success`);
    } catch (err) {
      console.error("Error submitting application:", err);
      setError(
        err.message || "Failed to submit application. Please try again."
      );
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

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <p className="text-red-600 text-xl mb-4">
            {error || "Could not load profile data."}
          </p>
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
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Confirm Your Application
          </h1>
          <p className="text-gray-600">
            Review your profile information before submitting.
          </p>
        </div>

        {job && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              Applying for:
            </h2>
            <p className="text-2xl font-bold text-blue-600">{job.title}</p>
            <p className="text-lg text-gray-700">{job.company}</p>
          </div>
        )}

        <div className="bg-white p-8 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Your Profile Snapshot
          </h2>

          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">
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
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* FIXED: Interests Section */}
            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* FIXED: Work Experience Section */}
            {profile.workExperience && profile.workExperience.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">
                  Work Experience
                </h3>
                <div className="space-y-4">
                  {profile.workExperience.map((exp, index) => (
                    <div key={index}>
                      <p className="font-semibold text-gray-800">
                        {exp.position} at {exp.company}
                      </p>
                      <p className="text-sm text-gray-600">{exp.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FIXED: Education Section */}
            {profile.education && profile.education.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">
                  Education
                </h3>
                <div className="space-y-4">
                  {profile.education.map((edu, index) => (
                    <div key={index}>
                      <p className="font-semibold text-gray-800">
                        {edu.degree} from {edu.institution}
                      </p>
                      <p className="text-sm text-gray-600">{edu.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg mb-6 text-yellow-800">
          <p className="font-semibold">Important Notice:</p>
          <p className="text-sm">
            The profile information shown above will be submitted. Please ensure
            it is up-to-date.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={handleConfirmApplication}
            disabled={submitting}
            className={`w-full sm:w-auto flex-grow px-6 py-3 rounded-md font-bold text-lg transition ${
              submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {submitting ? "Submitting..." : "Confirm & Submit Application"}
          </button>
          <button
            onClick={handleCancel}
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-bold text-lg transition"
          >
            Cancel
          </button>
        </div>

        {/* FIXED: Add Edit Profile Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/profile/edit")}
            className="text-blue-600 hover:text-blue-800 font-semibold underline"
          >
            Need to make changes? Edit your profile
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApplicationConfirmPage;
