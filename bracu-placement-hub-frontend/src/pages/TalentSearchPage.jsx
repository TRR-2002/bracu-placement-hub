import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";  // ← ADD THIS


function TalentSearchPage() {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    keywords: "",
    skills: "",
    minCGPA: "",
    department: "",
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");

  useEffect(() => {
    checkAuthAndFetchJobs();
  }, []);

  const checkAuthAndFetchJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Verify recruiter role
      const profileResponse = await fetch("http://localhost:1350/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const profileData = await profileResponse.json();
      if (profileData.user.role !== "recruiter") {
        navigate("/");
        return;
      }

      // Fetch recruiter's open jobs
      const jobsResponse = await fetch("http://localhost:1350/api/recruiter/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const jobsData = await jobsResponse.json();
      if (jobsData.success) {
        setJobs(jobsData.jobs.filter((j) => j.status === "Open"));
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:1350/api/recruiter/search-talent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          keywords: searchData.keywords,
          skills: searchData.skills
            ? searchData.skills.split(",").map((s) => s.trim())
            : [],
          minCGPA: searchData.minCGPA ? parseFloat(searchData.minCGPA) : null,
          department: searchData.department,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setStudents(data.students);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (studentId, studentName) => {
    if (!selectedJob) {
      alert("Please select a job first");
      return;
    }

    if (!window.confirm(`Send invitation to ${studentName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/recruiter/invite/${studentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            jobId: selectedJob,
            message: "We'd love to see you apply for this position!",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      alert("Invitation sent successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClearFilters = () => {
    setSearchData({
      keywords: "",
      skills: "",
      minCGPA: "",
      department: "",
    });
    setStudents([]);
  };

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🔍 AI-Powered Talent Search
            </h1>
            <p className="text-gray-600">
              Find the perfect candidates using intelligent matching
            </p>
          </div>
          <button
            onClick={() => navigate("/recruiter/dashboard")}
            className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Search Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Search Criteria</h2>
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords
                </label>
                <input
                  type="text"
                  value={searchData.keywords}
                  onChange={(e) =>
                    setSearchData({ ...searchData, keywords: e.target.value })
                  }
                  placeholder="Name, department, interests..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={searchData.skills}
                  onChange={(e) =>
                    setSearchData({ ...searchData, skills: e.target.value })
                  }
                  placeholder="JavaScript, React, Python"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Min CGPA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum CGPA
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={searchData.minCGPA}
                  onChange={(e) =>
                    setSearchData({ ...searchData, minCGPA: e.target.value })
                  }
                  placeholder="3.50"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={searchData.department}
                  onChange={(e) =>
                    setSearchData({ ...searchData, department: e.target.value })
                  }
                  placeholder="Computer Science"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 rounded-md font-semibold transition ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {loading ? "Searching..." : "🔍 Search Talent"}
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-semibold transition"
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        {/* Job Selection for Invitations */}
        {students.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              📧 Select a job to invite candidates:
            </label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a job --</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} at {job.company}
                </option>
              ))}
            </select>
            {!selectedJob && (
              <p className="text-sm text-blue-700 mt-2">
                Select a job to enable invitation buttons
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* No Results */}
        {students.length === 0 && !loading && (
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-xl text-gray-600 mb-2">No students found</p>
            <p className="text-gray-500">
              Try different search criteria or adjust your filters
            </p>
          </div>
        )}

        {/* Results */}
        {students.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-700 font-semibold">
                Found {students.length} matching{" "}
                {students.length === 1 ? "student" : "students"}
              </p>
              <p className="text-sm text-gray-600">
                Sorted by relevance score
              </p>
            </div>

            {students.map((student) => (
              <div
                key={student._id}
                className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Student Name and Match Score */}
                    <div className="flex items-center gap-4 mb-3">
                      <h2 className="text-2xl font-bold text-gray-800">
                        {student.name}
                      </h2>
                      {student.relevanceScore > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                            {student.matchPercentage.toFixed(0)}% Match
                          </span>
                          <span className="text-xs text-gray-500">
                            Score: {student.relevanceScore}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-800">
                          {student.email}
                        </p>
                      </div>
                      {student.department && (
                        <div>
                          <p className="text-sm text-gray-600">Department</p>
                          <p className="font-semibold text-gray-800">
                            {student.department}
                          </p>
                        </div>
                      )}
                      {student.cgpa && (
                        <div>
                          <p className="text-sm text-gray-600">CGPA</p>
                          <p className="font-semibold text-gray-800">
                            {student.cgpa.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {student.skills && student.skills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-2 font-semibold">
                          Skills:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {student.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interests */}
                    {student.interests && student.interests.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-2 font-semibold">
                          Interests:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {student.interests.map((interest, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Work Experience */}
                    {student.workExperience &&
                      student.workExperience.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2 font-semibold">
                            Work Experience:
                          </p>
                          <div className="space-y-2">
                            {student.workExperience.slice(0, 2).map((exp, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                              >
                                <p className="font-semibold text-gray-800">
                                  {exp.position}
                                </p>
                                <p className="text-sm text-gray-700">
                                  {exp.company} • {exp.duration}
                                </p>
                                {exp.description && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {exp.description}
                                  </p>
                                )}
                              </div>
                            ))}
                            {student.workExperience.length > 2 && (
                              <p className="text-xs text-gray-500">
                                +{student.workExperience.length - 2} more
                                experience(s)
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Education */}
                    {student.education && student.education.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2 font-semibold">
                          Education:
                        </p>
                        {student.education.slice(0, 1).map((edu, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-green-50 rounded-lg border border-green-200"
                          >
                            <p className="font-semibold text-gray-800">
                              {edu.degree}
                            </p>
                            <p className="text-sm text-gray-700">
                              {edu.institution} • {edu.year}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Invite Button */}
                  <div className="ml-4">
                    <button
                      onClick={() => handleInvite(student._id, student.name)}
                      disabled={!selectedJob}
                      className={`px-6 py-3 rounded-md font-semibold transition ${
                        selectedJob
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      📧 Send Invitation
                    </button>
                    {!selectedJob && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Select job first
                      </p>
                    )}
                  </div>
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

export default TalentSearchPage;
