// src/pages/JobSearchPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { searchJobs } from "../api/jobApi";
import Navbar from "../components/Navbar";

function JobSearchPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    keyword: "",
    location: "",
    minSalary: "",
    maxSalary: "",
  });

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const jobsData = await searchJobs(filters);

      if (jobsData.success) {
        setJobs(jobsData.jobsResponse || []);
      } else {
        throw new Error("Failed to fetch jobs");
      }
    } catch (err) {
      setError(err.error || "Failed to load jobs.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
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
                return (
                  // --- FIX: Removed onClick from this main div ---
                  <div
                    key={job._id}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
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
                        {(job.salaryMin || job.salaryMax) && (
                          <p className="text-gray-700 font-semibold mt-2">
                             ৳ {job.salaryMin?.toLocaleString()} - ৳ {job.salaryMax?.toLocaleString()}
                          </p>
                        )}
                        {job.applicationDeadline && (
                          <p className="text-sm text-red-700 font-medium mt-1">
                            Deadline:{" "}
                            {new Date(job.applicationDeadline).toLocaleString()}
                          </p>
                        )}
                      </div>

                    </div>
                    {/* --- FIX: Added the View Details button back --- */}
                    <div className="mt-4">
                      <button
                        onClick={() => navigate(`/jobs/${job._id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700"
                      >
                        View Details →
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
