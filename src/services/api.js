import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  signup: (email, password, name) =>
    apiClient.post('/auth/signup', { email, password, name }),
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  getProfile: () => apiClient.get('/auth/profile'),
};

export const resumeAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return apiClient.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  get: () => apiClient.get('/resume'),
};

export const jobsAPI = {
  fetch: (search, location) =>
    apiClient.post('/jobs/fetch', { search, location }),
  getFiltered: (filters) =>
    apiClient.get('/jobs', { params: filters }),
  getJob: (jobId) =>
    apiClient.get(`/jobs/${jobId}`),
  getFilterOptions: () =>
    apiClient.get('/jobs/options/filters'),
  search: (search, location) =>
    apiClient.post('/jobs/search', { search, location }),
};

export const applicationsAPI = {
  apply: (jobId, jobDetails = null) => apiClient.post('/applications/apply', { jobId, jobDetails }),
  getAll: () => apiClient.get('/applications'),
  updateStatus: (applicationId, status) =>
    apiClient.put(`/applications/${applicationId}/status`, { status }),
};

export const aiAPI = {
  chat: (messages) => apiClient.post('/ai/chat', { messages }),
  matchJobs: (jobIds, maxJobs = 5) => apiClient.post('/ai/match-jobs', { jobIds, maxJobs }),
  getStatus: () => apiClient.get('/ai/status'),
};

export default apiClient;
