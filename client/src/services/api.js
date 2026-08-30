import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

export const userAPI = {
  updateProfile: (data) => api.put("/users/profile", data),
  search: (skill) => api.get("/users/search", { params: { skill } }),
  getById: (id) => api.get(`/users/${id}`),
};

export const matchAPI = {
  getMatches: () => api.get("/matches"),
  getChains: () => api.get("/matches/chains"),
};

export const messageAPI = {
  getConversation: (userId) => api.get(`/messages/${userId}`),
};

export default api;
