import axios from "axios";
import { API_BASE_URL } from "./constant";
import { message } from "antd";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      message.destroy()
      message.error("Your session expired. Sign in again to continue checkout.");
      localStorage.removeItem("token");
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const loginUrl = currentPath.startsWith("/login")
        ? "/login"
        : `/login?reason=session-expired&returnTo=${encodeURIComponent(currentPath)}`;
      setTimeout(() => {
        window.location.href = loginUrl;
      }, 1000);
    } else if (error.response?.status === 403) {
      message.error("You don’t have permission to perform this action.");
    } else if (error.response?.status === 404) {
      message.error("Requested resource not found.");
    } else if (error.response?.status >= 500) {
      message.error("Server error. Please try again later.");
    }
    return Promise.reject(error);
  }
);

export default api;