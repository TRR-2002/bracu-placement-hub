import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";  // ← ADD THIS


function EditProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    studentId: "",
    department: "",
    cgpa: "",
    skills: [],
    interests: [],
  });
  const [workExperience, setWorkExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/");

        const response = await fetch("http://localhost:1350/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch profile");

        const data = await response.json();
        const user = data.user;

        setFormData({
          studentId: user.studentId || "",
          department: user.department || "",
          cgpa: user.cgpa || "",
          skills: user.skills || [],
          interests: user.interests || [],
        });
        setWorkExperience(user.workExperience || []);
        setEducation(user.education || []);
      } catch {
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };
  const handleRemoveSkill = (skillToRemove) =>
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
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
  const handleRemoveInterest = (interestToRemove) =>
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter(
        (interest) => interest !== interestToRemove
      ),
    }));

  const handleExperienceInputChange = (e) =>
    setNewExperience((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAddExperience = () => {
    if (!newExperience.company || !newExperience.position)
      return setError("Company and Position are required.");
    setWorkExperience((prev) => [...prev, newExperience]);
    setNewExperience({
      company: "",
      position: "",
      duration: "",
      description: "",
    });
    setError("");
  };
  const handleRemoveExperience = (index) =>
    setWorkExperience((prev) => prev.filter((_, i) => i !== index));

  const handleEducationInputChange = (e) =>
    setNewEducation((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAddEducation = () => {
    if (!newEducation.institution || !newEducation.degree)
      return setError("Institution and Degree are required.");
    setEducation((prev) => [...prev, newEducation]);
    setNewEducation({ institution: "", degree: "", year: "" });
    setError("");
  };
  const handleRemoveEducation = (index) =>
    setEducation((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      if (!token || !userId) throw new Error("Authentication error.");

      const profileData = { ...formData, workExperience, education };

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

      if (!response.ok)
        throw new Error(
          (await response.json()).error || "Failed to update profile"
        );

      setSuccess("Profile updated successfully!");
      setTimeout(() => navigate(`/profile/view/${userId}`), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Edit Your Profile</h1>
          <Link
            to={`/profile/view/${localStorage.getItem("userId")}`}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
          >
            Back to View
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* All Form Sections (JSX) are included below */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Student ID
            </label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Department
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">CGPA</label>
            <input
              type="number"
              name="cgpa"
              value={formData.cgpa}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              max="4"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill"
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
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
                    className="text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              Interests
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                placeholder="Add an interest"
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="px-4 py-2 bg-green-600 text-white rounded-md"
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
                    className="text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              Work Experience
            </label>
            <div className="space-y-2 mb-4">
              {workExperience.map((exp, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border flex justify-between items-start"
                >
                  <p className="font-semibold">
                    {exp.position} at {exp.company}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(index)}
                    className="text-red-600 font-bold text-xl"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold mb-3 text-purple-800">
                Add New Experience
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  name="company"
                  value={newExperience.company}
                  onChange={handleExperienceInputChange}
                  placeholder="Company"
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  name="position"
                  value={newExperience.position}
                  onChange={handleExperienceInputChange}
                  placeholder="Position"
                  className="p-2 border rounded"
                />
              </div>
              <input
                type="text"
                name="duration"
                value={newExperience.duration}
                onChange={handleExperienceInputChange}
                placeholder="Duration"
                className="w-full p-2 border rounded mb-3"
              />
              <textarea
                name="description"
                value={newExperience.description}
                onChange={handleExperienceInputChange}
                placeholder="Description (optional)"
                className="w-full p-2 border rounded mb-3"
                rows="2"
              />
              <button
                type="button"
                onClick={handleAddExperience}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded"
              >
                {" "}
                + Add Experience
              </button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              Education
            </label>
            <div className="space-y-2 mb-4">
              {education.map((edu, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border flex justify-between items-start"
                >
                  <p className="font-semibold">
                    {edu.degree} from {edu.institution}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(index)}
                    className="text-red-600 font-bold text-xl"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold mb-3 text-green-800">
                Add New Education
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  name="institution"
                  value={newEducation.institution}
                  onChange={handleEducationInputChange}
                  placeholder="Institution"
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  name="degree"
                  value={newEducation.degree}
                  onChange={handleEducationInputChange}
                  placeholder="Degree"
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  name="year"
                  value={newEducation.year}
                  onChange={handleEducationInputChange}
                  placeholder="Year"
                  className="p-2 border rounded"
                />
              </div>
              <button
                type="button"
                onClick={handleAddEducation}
                className="w-full px-4 py-2 bg-green-600 text-white rounded"
              >
                + Add Education
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full font-bold py-3 mt-4 rounded-md transition ${
              isSubmitting
                ? "bg-gray-400"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
    </>
  );
}

export default EditProfilePage;
