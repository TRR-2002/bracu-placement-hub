import React from "react";
import { useNavigate, useRouteError } from "react-router-dom";
import Navbar from "../components/Navbar";

function ErrorPage() {
  const navigate = useNavigate();
  const error = useRouteError();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-8 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            {error?.status === 404 ? "Page Not Found" : "Oops! Something went wrong"}
          </h1>
          
          <p className="text-gray-600 mb-2">
            {error?.status === 404
              ? "The page you're looking for doesn't exist or has been moved."
              : error?.statusText || "An unexpected error occurred"}
          </p>

          {error?.message && (
            <div className="bg-gray-100 p-3 rounded-md mb-6 text-left text-sm text-gray-700 max-h-32 overflow-y-auto">
              <p className="font-mono">{error.message}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
            >
              ← Go Back
            </button>
            <button
              onClick={() => navigate("/notifications")}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
            >
              Go to Notifications
            </button>
            <button
              onClick={() => navigate("/jobs")}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ErrorPage;
