// src/pages/JobSearchPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { searchJobs, saveJob, unsaveJob } from "../api/jobApi";
import api from "../api/axiosConfig";
import Navbar from "../components/Navbar";

function JobSearchPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set()); // Use a Set for efficient lookups
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    keyword: "",
    location: "",
    minSalary: "",
    maxSalary: "",
  });

  const fetchJobsAndSavedStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const [jobsData, overviewData] = await Promise.all([
        searchJobs(filters),
        api.get("/dashboard/overview"),
      ]);

      if (jobsData.success) {
        setJobs(jobsData.jobsResponse || []);
      } else {
        throw new Error("Failed to fetch jobs");
      }

      if (overviewData.data?.savedJobs) {
        const savedIds = new Set(
          overviewData.data.savedJobs.map((job) => job._id)
        );
        setSavedJobIds(savedIds);
      }
    } catch (err) {
      setError(err.error || "Failed to load jobs.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsAndSavedStatus();
  }, []); // Fetch only on initial load

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobsAndSavedStatus(); // Re-fetch with new filters
  };

  const handleSaveToggle = async (jobId, e) => {
    e.stopPropagation(); // Prevent navigation when clicking the save button

    try {
      const newSavedJobIds = new Set(savedJobIds);
      if (savedJobIds.has(jobId)) {
        await unsaveJob(jobId);
        newSavedJobIds.delete(jobId);
      } else {
        await saveJob(jobId);
        newSavedJobIds.add(jobId);
      }
      setSavedJobIds(newSavedJobIds);
    } catch (err) {
      alert(err.error || "Could not update save status.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Search Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input
                  name="keyword"
                  placeholder="Keyword"
                  value={filters.keyword}
                  onChange={handleFilterChange}
                  className="md:col-span-2 p-3 border rounded-md"
                />
                <input
                  name="location"
                  placeholder="Location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="p-3 border rounded-md"
                />
                <input
                  name="minSalary"
                  placeholder="Min Salary"
                  type="number"
                  value={filters.minSalary}
                  onChange={handleFilterChange}
                  className="p-3 border rounded-md"
                />
                <input
                  name="maxSalary"
                  placeholder="Max Salary"
                  type="number"
                  value={filters.maxSalary}
                  onChange={handleFilterChange}
                  className="p-3 border rounded-md"
                />
              </div>
              <button
                type="submit"
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md font-semibold"
              >
                Search
              </button>
            </form>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-center text-gray-600 text-lg">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="text-center text-gray-600 text-lg">No jobs found.</p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const isSaved = savedJobIds.has(job._id);
                return (
                  <div
                    key={job._id}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
                    onClick={() => navigate(`/jobs/${job._id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">
                          {job.title}
                        </h2>
                        <p
                          className="text-blue-600 font-semibold hover:underline mb-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/company/${job.companyId}`);
                          }}
                        >
                          {job.company}
                        </p>
                        <p className="text-gray-500 text-sm">{job.location}</p>
                        {job.applicationDeadline && (
                          <p className="text-sm text-red-700 font-medium mt-2">
                            Deadline:{" "}
                            {new Date(job.applicationDeadline).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleSaveToggle(job._id, e)}
                        className={`p-2 rounded-full transition ${
                          isSaved
                            ? "text-yellow-500"
                            : "text-gray-400 hover:text-yellow-500"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill={isSaved ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default JobSearchPage;
