import axios from "axios";

// One axios instance for the whole app. baseURL points at our Express API.
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Before every request, attach the JWT from localStorage (if logged in).
// This is why we don't manually add the Authorization header everywhere.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
