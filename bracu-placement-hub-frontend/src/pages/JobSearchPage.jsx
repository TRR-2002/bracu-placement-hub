import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function JobSearchPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State - Reverted to include salary and remove jobType
  const [filters, setFilters] = useState({
    keyword: "",
    location: "",
    minSalary: "",
    maxSalary: "",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // FIXED: Implemented Backend-Side Filtering
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to view jobs");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      // Build query parameters from filters state
      const params = new URLSearchParams();
      if (filters.keyword) params.append("keyword", filters.keyword);
      if (filters.location) params.append("location", filters.location);
      if (filters.minSalary) params.append("minSalary", filters.minSalary);
      if (filters.maxSalary) params.append("maxSalary", filters.maxSalary);

      // Call the correct backend search endpoint
      const response = await fetch(
        `http://localhost:1350/api/jobs/search?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [filters, navigate]); // Re-fetch when filters change

  // Initial fetch on component mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const clearFilters = () => {
    setFilters({
      keyword: "",
      location: "",
      minSalary: "",
      maxSalary: "",
    });
    // The useEffect will automatically re-fetch with cleared filters
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Job Discovery
          </h1>
          <p className="text-gray-600">
            Find your next opportunity from available positions
          </p>
        </div>

        {/* Filters Form */}
        <form
          onSubmit={handleSearch}
          className="bg-white p-6 rounded-lg shadow-md mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search Keywords */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Search Keywords
              </label>
              <input
                type="text"
                name="keyword"
                value={filters.keyword}
                onChange={handleFilterChange}
                placeholder="Job title, company..."
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="City or area"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Min Salary */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Min Salary (BDT)
              </label>
              <input
                type="number"
                name="minSalary"
                value={filters.minSalary}
                onChange={handleFilterChange}
                placeholder="e.g., 30000"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Max Salary */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Max Salary (BDT)
              </label>
              <input
                type="number"
                name="maxSalary"
                value={filters.maxSalary}
                onChange={handleFilterChange}
                placeholder="e.g., 100000"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search Jobs
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Job Listings */}
        <p className="text-gray-600 mb-4">{jobs.length} jobs found</p>

        {jobs.length === 0 && !loading ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <p className="text-xl text-gray-600 mb-2">
              No jobs found matching your criteria
            </p>
            <p className="text-gray-500">
              Try adjusting your search filters or check back later for new
              opportunities
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/jobs/${job._id}`)}
              >
                <h2 className="text-2xl font-bold text-gray-800">
                  {job.title}
                </h2>
                <p className="text-lg text-gray-600">{job.company}</p>
                <p className="text-sm text-gray-500 mb-2">{job.location}</p>

                {/* FIXED: Display Salary Range */}
                {(job.salaryMin || job.salaryMax) && (
                  <p className="text-md font-semibold text-green-600 my-2">
                    BDT {job.salaryMin || "..."} - {job.salaryMax || "..."}
                  </p>
                )}

                <p className="text-gray-700 line-clamp-2 my-2">
                  {job.description}
                </p>

                <div className="flex justify-between items-center mt-4">
                  <p className="text-xs text-gray-500">
                    Posted on: {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                  <span className="text-blue-600 font-semibold">
                    View Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default JobSearchPage;
