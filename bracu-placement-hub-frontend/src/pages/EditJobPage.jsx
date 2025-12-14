import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditJobPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    latitude: "",
    longitude: "",
    salaryMin: "",
    salaryMax: "",
    description: "",
    requiredSkills: [],
    type: "Full-time",
    status: "Open",
  });
  const [skillInput, setSkillInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:1350/api/recruiter/jobs/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch job details");
      }

      const data = await response.json();
      const job = data.job;

      setFormData({
        title: job.title || "",
        company: job.company || "",
        location: job.location || "",
        latitude: job.coordinates?.lat || "",
        longitude: job.coordinates?.lng || "",
        salaryMin: job.salaryMin || "",
        salaryMax: job.salaryMax || "",
        description: job.description || "",
        requiredSkills: job.requiredSkills || [],
        type: job.type || "Full-time",
        status: job.status || "Open",
      });
    } catch (err) {
      console.error("Error fetching job:", err);
      setError("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSkill = () => {
    if (
      skillInput.trim() &&
      !formData.requiredSkills.includes(skillInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(
        (skill) => skill !== skillToRemove
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.company || !formData.description) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const jobData = {
        title: formData.title,
        company: formData.company,
        location: formData.location || undefined,
        coordinates:
          formData.latitude && formData.longitude
            ? {
                lat: parseFloat(formData.latitude),
                lng: parseFloat(formData.longitude),
              }
            : undefined,
        salaryMin: formData.salaryMin
          ? parseInt(formData.salaryMin)
          : undefined,
        salaryMax: formData.salaryMax
          ? parseInt(formData.salaryMax)
          : undefined,
        description: formData.description,
        requiredSkills: formData.requiredSkills,
        type: formData.type,
        status: formData.status,
      };

      const response = await fetch(
        `http://localhost:1350/api/recruiter/jobs/${jobId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(jobData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update job");
      }

      alert("Job updated successfully!");
      navigate("/recruiter/dashboard");
    } catch (err) {
      console.error("Error updating job:", err);
      setError(err.message || "Failed to update job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading job details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Edit Job Posting</h1>
          <button
            onClick={() => navigate("/recruiter/dashboard")}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Form */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Job Title */}
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Company */}
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Job Type and Status */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Job Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                  <option value="Filled">Filled</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>

            {/* Coordinates */}
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Coordinates (Optional)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="Latitude"
                  step="any"
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="Longitude"
                  step="any"
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Salary Range */}
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Salary Range (BDT)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  name="salaryMin"
                  value={formData.salaryMin}
                  onChange={handleInputChange}
                  placeholder="Min"
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  name="salaryMax"
                  value={formData.salaryMax}
                  onChange={handleInputChange}
                  placeholder="Max"
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Job Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="6"
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Required Skills */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">
                Required Skills
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Add a skill"
                  className="flex-1 p-3 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-red-600 hover:text-red-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 font-bold py-3 rounded-md transition ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isSubmitting ? "Saving Changes..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/recruiter/dashboard")}
                className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditJobPage;
