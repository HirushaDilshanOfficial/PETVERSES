// src/lib/axios.js
import axios from "axios";

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api",
  withCredentials: true, // Important for cookies/sessions
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
