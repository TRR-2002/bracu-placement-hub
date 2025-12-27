import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJobDetails } from "../api/jobApi";
import Navbar from "../components/Navbar";  // ← ADD THIS


function ApplicationSuccessPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const data = await getJobDetails(jobId);
      setJob(data.job);
    } catch (err) {
      console.error("Error fetching job details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Application Submitted Successfully!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your application has been sent to the recruiter
          </p>

          {/* Job Info */}
          {job && (
            <div className="bg-gray-50 p-6 rounded-lg mb-8 border-l-4 border-green-500">
              <p className="text-sm text-gray-600 mb-2">You applied for:</p>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {job.title}
              </h2>
              <p className="text-lg text-blue-600 font-semibold">
                {job.company}
              </p>
              {job.location && (
                <p className="text-gray-600 mt-2">📍 {job.location}</p>
              )}
            </div>
          )}

          {/* What's Next Section */}
          <div className="bg-blue-50 p-6 rounded-lg mb-8 text-left">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              What happens next?
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                The recruiter will review your application and profile
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                You'll receive notifications about your application status
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Track your application progress in your dashboard
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/jobs")}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold text-lg transition"
            >
              Browse More Jobs
            </button>
            <button
              onClick={() =>
                navigate(`/profile/view/${localStorage.getItem("userId")}`)
              }
              className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-bold text-lg transition"
            >
              Go to My Profile
            </button>
          </div>
        </div>

        {/* Additional Tips */}
        <div className="mt-6 text-center text-gray-600">
          <p className="text-sm">
            💡 <strong>Tip:</strong> Keep your profile updated to increase your
            chances of getting hired!
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

export default ApplicationSuccessPage;
