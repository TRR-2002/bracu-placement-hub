import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getJobApplications } from "../api/jobApi";

function JobApplicationsPage() {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const data = await getJobApplications(jobId);

        // Ensure applications is always an array
        if (Array.isArray(data.applications)) {
          setApplications(data.applications);
        } else {
          setApplications([]);
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
        setError(err.error || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [jobId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date)) return "N/A";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Job Applications</h1>

          {loading ? (
            <p>Loading applications...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : applications.length === 0 ? (
            <p>No applications found.</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {app.user?.name || "Unnamed Candidate"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(app.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {app.status || "Pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default JobApplicationsPage;
