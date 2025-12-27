import api from "./axiosConfig";

// ------------------------------
// Utility: Get Auth Headers
// ------------------------------
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No auth token found");
  return { Authorization: `Bearer ${token}` };
};

// ------------------------------
// JOBS
// ------------------------------

// Search jobs with filters
export const searchJobs = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.keyword) params.append("keyword", filters.keyword);
    if (filters.location) params.append("location", filters.location);
    if (filters.minSalary) params.append("minSalary", filters.minSalary);
    if (filters.maxSalary) params.append("maxSalary", filters.maxSalary);

    const headers = getAuthHeaders();

    const response = await api.get(`/jobs/search?${params.toString()}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get single job details
export const getJobDetails = async (jobId) => {
  try {
    const headers = getAuthHeaders();
    const response = await api.get(`/jobs/${jobId}`, { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Apply to a job (student)
export const applyToJob = async (jobId) => {
  try {
    const headers = getAuthHeaders();
    const response = await api.post("/jobs/apply", { jobId }, { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
// Save a job
export const saveJob = async (jobId) => {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) throw new Error("User not found for saving job.");

    const response = await api.post(`/dashboard/saved-jobs/${userId}`, {
      jobId,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Unsave a job
export const unsaveJob = async (jobId) => {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) throw new Error("User not found for unsaving job.");

    // NOTE: The backend uses a DELETE request with a body, which is unconventional.
    // Axios handles this, but it's good to be aware of.
    const response = await api.delete(`/dashboard/saved-jobs/${userId}`, {
      data: { jobId },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
// Get user's applications (student)
export const getMyApplications = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await api.get("/applications/my-applications", {
      headers,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ------------------------------
// RECRUITER: Job Applications
// ------------------------------
export const getJobApplications = async (jobId) => {
  try {
    const headers = getAuthHeaders();
    const response = await api.get(`/recruiter/jobs/${jobId}/applications`, {
      headers,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ------------------------------
// NOTIFICATIONS
// ------------------------------
export const fetchNotifications = async (unreadOnly = true) => {
  try {
    const headers = getAuthHeaders();
    const response = await api.get(
      `/notifications${unreadOnly ? "?unread=true" : ""}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const headers = getAuthHeaders();
    const response = await api.put(
      `/notifications/${notificationId}/read`,
      {},
      { headers }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await api.get("/notifications/unread-count", { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ------------------------------
// MESSAGES
// ------------------------------
export const getUnreadMessageCount = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await api.get("/messages/unread/count", { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchMessages = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await api.get("/messages", { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
