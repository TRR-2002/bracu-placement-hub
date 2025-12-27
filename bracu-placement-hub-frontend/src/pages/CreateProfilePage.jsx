import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";



function CreateProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    studentId: "",
    department: "",
    cgpa: "",
    skills: [],
    interests: [],
  });
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [workExperience, setWorkExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [newExperience, setNewExperience] = useState({
    company: "",
    position: "",
    duration: "",
    description: "",
  });
  const [newEducation, setNewEducation] = useState({
    institution: "",
    degree: "",
    year: "",
  });

  // Route protection: Check if user already has a profile
  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await fetch(
          "http://localhost:1350/api/profile/status",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile status");
        }

        const data = await response.json();
        console.log("Profile Status Check:", data);

        // If user already has a profile, redirect them to view profile
        if (data.hasProfile) {
          console.log("User already has a profile. Redirecting...");
          navigate(`/profile/view/${data.userId}`);
        }
      } catch (err) {
        console.error("Error checking profile status:", err);
        setError("Error checking profile status. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    checkProfileStatus();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleAddInterest = () => {
    if (
      interestInput.trim() &&
      !formData.interests.includes(interestInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()],
      }));
      setInterestInput("");
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter(
        (interest) => interest !== interestToRemove
      ),
    }));
  };

  // --- Handlers for Work Experience ---
  const handleExperienceInputChange = (e) => {
    const { name, value } = e.target;
    setNewExperience((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddExperience = () => {
    if (
      !newExperience.company ||
      !newExperience.position ||
      !newExperience.duration
    ) {
      setError("Please fill in company, position, and duration");
      return;
    }
    setWorkExperience((prev) => [...prev, { ...newExperience }]);
    setNewExperience({
      company: "",
      position: "",
      duration: "",
      description: "",
    });
    setError("");
  };

  const handleRemoveExperience = (index) => {
    setWorkExperience((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Handlers for Education ---
  const handleEducationInputChange = (e) => {
    const { name, value } = e.target;
    setNewEducation((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEducation = () => {
    if (
      !newEducation.institution ||
      !newEducation.degree ||
      !newEducation.year
    ) {
      setError("Please fill in all education fields");
      return;
    }
    setEducation((prev) => [...prev, { ...newEducation }]);
    setNewEducation({ institution: "", degree: "", year: "" });
    setError("");
  };

  const handleRemoveEducation = (index) => {
    setEducation((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!formData.department || !formData.cgpa) {
      setError("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    if (formData.skills.length === 0 || formData.interests.length === 0) {
      setError("Please add at least one skill and one interest.");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        setError("Authentication error. Please log in again.");
        setIsSubmitting(false);
        return;
      }

      // Combine all profile data including the new arrays
      const profileData = {
        ...formData,
        workExperience,
        education,
      };

      const response = await fetch(
        `http://localhost:1350/api/profile/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create profile");
      }

      const data = await response.json();
      console.log("Profile created successfully:", data);
      alert("Profile created successfully!");
      navigate(`/profile/view/${userId}`);
    } catch (err) {
      console.error("Error creating profile:", err);
      setError(err.message || "Failed to create profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">Create Your Profile</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Student ID */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Student ID
            </label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleInputChange}
              placeholder="e.g., 23101350"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Department */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Department *
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              placeholder="e.g., Computer Science"
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* CGPA */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">CGPA *</label>
            <input
              type="number"
              name="cgpa"
              value={formData.cgpa}
              onChange={handleInputChange}
              placeholder="e.g., 3.95"
              step="0.01"
              min="0"
              max="4"
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Skills */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Skills *
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
                placeholder="Add a skill (e.g., JavaScript)"
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              Interests *
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
                placeholder="Add an interest (e.g., Web Development)"
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.interests.map((interest) => (
                <span
                  key={interest}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-2"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Work Experience Section */}
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              Work Experience (Optional)
            </label>

            {/* Form to Add a New Experience */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 mb-4">
              <h3 className="font-semibold mb-3 text-purple-800">
                Add Work Experience
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  name="company"
                  value={newExperience.company}
                  onChange={handleExperienceInputChange}
                  placeholder="Company (e.g., Google, Microsoft)"
                  className="p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  name="position"
                  value={newExperience.position}
                  onChange={handleExperienceInputChange}
                  placeholder="Position (e.g., Software Engineer Intern)"
                  className="p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  name="duration"
                  value={newExperience.duration}
                  onChange={handleExperienceInputChange}
                  placeholder="Duration (e.g., Jun 2023 - Aug 2023)"
                  className="p-2 border border-gray-300 rounded-md md:col-span-2"
                />
              </div>
              <textarea
                name="description"
                value={newExperience.description}
                onChange={handleExperienceInputChange}
                placeholder="Description (optional) - What did you do? Technologies used?"
                className="w-full p-2 border border-gray-300 rounded-md mb-3"
                rows="2"
              />
              <button
                type="button"
                onClick={handleAddExperience}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                + Add Experience
              </button>
            </div>

            {/* Display List of Added Experiences */}
            {workExperience.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">
                  Added experiences ({workExperience.length}):
                </p>
                {workExperience.map((exp, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {exp.position}
                      </p>
                      <p className="text-sm text-gray-600">
                        {exp.company} • {exp.duration}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {exp.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(index)}
                      className="ml-3 text-red-600 hover:text-red-800 font-bold text-xl"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education Section */}
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              Education (Optional)
            </label>

            {/* Form to Add New Education */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
              <h3 className="font-semibold mb-3 text-green-800">
                Add Education
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  name="institution"
                  value={newEducation.institution}
                  onChange={handleEducationInputChange}
                  placeholder="Institution (e.g., BRAC University)"
                  className="p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  name="degree"
                  value={newEducation.degree}
                  onChange={handleEducationInputChange}
                  placeholder="Degree (e.g., B.Sc. in CSE)"
                  className="p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  name="year"
                  value={newEducation.year}
                  onChange={handleEducationInputChange}
                  placeholder="Year (e.g., 2020-2024)"
                  className="p-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                type="button"
                onClick={handleAddEducation}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                + Add Education
              </button>
            </div>

            {/* Display List of Added Education */}
            {education.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">
                  Added education ({education.length}):
                </p>
                {education.map((edu, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {edu.degree}
                      </p>
                      <p className="text-sm text-gray-600">
                        {edu.institution} • {edu.year}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(index)}
                      className="ml-3 text-red-600 hover:text-red-800 font-bold text-xl"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full font-bold py-2 rounded-md transition ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isSubmitting ? "Creating Profile..." : "Create Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateProfilePage;
