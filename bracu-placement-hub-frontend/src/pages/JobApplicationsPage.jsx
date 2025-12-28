import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getJobApplications, updateApplicationStatus, scheduleInterview } from "../api/jobApi";

function JobApplicationsPage() {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [acceptedApplicationId, setAcceptedApplicationId] = useState(null);
  const [interviewTime, setInterviewTime] = useState("");
  const [meetLink, setMeetLink] = useState("");

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

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

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      if (
        !window.confirm(
          `Are you sure you want to mark this application as ${newStatus}?`
        )
      ) {
        return;
      }

      await updateApplicationStatus(applicationId, newStatus);
      alert(`Application ${newStatus} successfully!`);
      
      // If accepted, show interview scheduling modal
      if (newStatus === "Accepted") {
        setAcceptedApplicationId(applicationId);
        setShowInterviewModal(true);
      }
      
      fetchApplications(); // Refresh list
      if (selectedApplicant) setSelectedApplicant(null); // Close modal if open
    } catch (err) {
      console.error("Error updating status:", err);
      alert(err.error || "Failed to update status");
    }
  };

  const handleScheduleInterview = async () => {
    try {
      if (!interviewTime) {
        alert("Please select an interview date and time");
        return;
      }

      await scheduleInterview(acceptedApplicationId, interviewTime, meetLink);
      alert("Interview scheduled successfully! Calendar invites sent.");
      
      // Reset modal state
      setShowInterviewModal(false);
      setAcceptedApplicationId(null);
      setInterviewTime("");
      setMeetLink("");
    } catch (err) {
      console.error("Error scheduling interview:", err);
      alert(err.error || "Failed to schedule interview");
    }
  };

  const handleSkipInterview = () => {
    setShowInterviewModal(false);
    setAcceptedApplicationId(null);
    setInterviewTime("");
    setMeetLink("");
  };

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
        <div className="max-w-6xl mx-auto">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-0">
                            <div className="text-sm font-medium text-gray-900">
                              {app.user?.name || "Unnamed Candidate"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {app.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(app.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            app.status === "Accepted"
                              ? "bg-green-100 text-green-800"
                              : app.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {app.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedApplicant(app)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded"
                        >
                          View Details
                        </button>
                        {app.status === "Pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusUpdate(app._id, "Accepted")
                              }
                              className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(app._id, "Rejected")
                              }
                              className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PROFILE SNAPSHOT MODAL */}
        {selectedApplicant && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
                onClick={() => setSelectedApplicant(null)}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="w-full">
                    <h3
                      className="text-2xl leading-6 font-bold text-gray-900 mb-6"
                      id="modal-title"
                    >
                      Your Profile Snapshot
                    </h3>

                    {/* Basic Information */}
                    <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-6">
                      <div>
                        <p className="text-sm text-gray-500 font-semibold">
                          Name
                        </p>
                        <p className="text-gray-900 font-medium">
                          {selectedApplicant.user?.name ||
                            selectedApplicant.profileSnapshot?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-semibold">
                          Email
                        </p>
                        <p className="text-gray-900 font-medium">
                          {selectedApplicant.user?.email ||
                            selectedApplicant.profileSnapshot?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-semibold">
                          Student ID
                        </p>
                        <p className="text-gray-900 font-medium">
                          {selectedApplicant.user?.studentId ||
                            selectedApplicant.profileSnapshot?.studentId ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-semibold">
                          Department
                        </p>
                        <p className="text-gray-900 font-medium">
                          {selectedApplicant.user?.department ||
                            selectedApplicant.profileSnapshot?.department ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-semibold">
                          CGPA
                        </p>
                        <p className="text-gray-900 font-medium">
                          {selectedApplicant.user?.cgpa ||
                            selectedApplicant.profileSnapshot?.cgpa ||
                            "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-6 border-t pt-4">
                      <h4 className="font-bold text-gray-700 mb-4">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedApplicant.user?.skills?.length > 0
                          ? selectedApplicant.user.skills
                          : selectedApplicant.profileSnapshot?.skills
                        )?.length > 0 ? (
                          (selectedApplicant.user?.skills?.length > 0
                            ? selectedApplicant.user.skills
                            : selectedApplicant.profileSnapshot?.skills
                          ).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">
                            No skills listed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Interests */}
                    <div className="mb-6 border-t pt-4">
                      <h4 className="font-bold text-gray-700 mb-4">
                        Interests
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedApplicant.user?.interests?.length > 0
                          ? selectedApplicant.user.interests
                          : selectedApplicant.profileSnapshot?.interests
                        )?.length > 0 ? (
                          (selectedApplicant.user?.interests?.length > 0
                            ? selectedApplicant.user.interests
                            : selectedApplicant.profileSnapshot?.interests
                          ).map((interest, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium"
                            >
                              {interest}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">
                            No interests listed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Work Experience */}
                    <div className="mb-6 border-t pt-4">
                      <h4 className="font-bold text-gray-700 mb-4">
                        Work Experience
                      </h4>
                      {(selectedApplicant.user?.workExperience?.length > 0
                        ? selectedApplicant.user.workExperience
                        : selectedApplicant.profileSnapshot?.workExperience
                      )?.length > 0 ? (
                        <div className="space-y-3">
                          {(selectedApplicant.user?.workExperience?.length > 0
                            ? selectedApplicant.user.workExperience
                            : selectedApplicant.profileSnapshot?.workExperience
                          ).map((exp, idx) => (
                            <div
                              key={idx}
                              className="p-4 bg-purple-50 rounded-lg border border-purple-100"
                            >
                              <h5 className="font-bold text-gray-900">
                                {exp.position}
                              </h5>
                              <p className="text-gray-700 font-medium">
                                {exp.company}
                              </p>
                              <p className="text-purple-700 text-sm my-1">
                                {exp.duration}
                              </p>
                              <p className="text-gray-600 text-sm">
                                {exp.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          No experience listed
                        </p>
                      )}
                    </div>

                    {/* Education */}
                    <div className="mb-6 border-t pt-4">
                      <h4 className="font-bold text-gray-700 mb-4">
                        Education
                      </h4>
                      {(selectedApplicant.user?.education?.length > 0
                        ? selectedApplicant.user.education
                        : selectedApplicant.profileSnapshot?.education
                      )?.length > 0 ? (
                        <div className="space-y-3">
                          {(selectedApplicant.user?.education?.length > 0
                            ? selectedApplicant.user.education
                            : selectedApplicant.profileSnapshot?.education
                          ).map((edu, idx) => (
                            <div
                              key={idx}
                              className="p-4 bg-green-50 rounded-lg border border-green-100"
                            >
                              <h5 className="font-bold text-gray-900">
                                {edu.degree}
                              </h5>
                              <p className="text-gray-700 font-medium">
                                {edu.institution}
                              </p>
                              <p className="text-green-700 text-sm mt-1">
                                {edu.year}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          No education listed
                        </p>
                      )}
                    </div>

                    {(selectedApplicant.user?.resumeLink ||
                      selectedApplicant.profileSnapshot?.resumeLink) && (
                      <div className="mt-6 border-t pt-4">
                        <a
                          href={
                            selectedApplicant.user?.resumeLink ||
                            selectedApplicant.profileSnapshot?.resumeLink
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 font-medium transition"
                        >
                          <span className="mr-2">📄</span> View Full Resume
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  {selectedApplicant.status === "Pending" && (
                    <>
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={() =>
                          handleStatusUpdate(selectedApplicant._id, "Accepted")
                        }
                      >
                        Accept Application
                      </button>
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={() =>
                          handleStatusUpdate(selectedApplicant._id, "Rejected")
                        }
                      >
                        Reject Application
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setSelectedApplicant(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INTERVIEW SCHEDULING MODAL */}
        {showInterviewModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                      <span className="text-2xl">📅</span>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3
                        className="text-lg leading-6 font-medium text-gray-900 mb-4"
                        id="modal-title"
                      >
                        Schedule Interview
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-4">
                          Application accepted! Would you like to schedule an
                          interview with this candidate?
                        </p>

                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="interviewTime"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Interview Date & Time *
                            </label>
                            <input
                              type="datetime-local"
                              id="interviewTime"
                              value={interviewTime}
                              onChange={(e) => setInterviewTime(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="meetLink"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Meeting Link (Optional)
                            </label>
                            <input
                              type="url"
                              id="meetLink"
                              value={meetLink}
                              onChange={(e) => setMeetLink(e.target.value)}
                              placeholder="https://meet.google.com/..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Add a Google Meet, Zoom, or other meeting link
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleScheduleInterview}
                  >
                    Schedule Interview
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleSkipInterview}
                  >
                    Skip for Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default JobApplicationsPage;
