import { API_BASE_URL } from "./constant";

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: result.message || "Login failed",
      };
    }

    const jwtData = result.data;
    if (!jwtData?.token || !jwtData?.role) {
      return {
        success: false,
        error: "The server returned an invalid login response.",
      };
    }

    localStorage.setItem("token", jwtData.token);
    localStorage.setItem("email", jwtData.email);
    localStorage.setItem("name", jwtData.name);
    localStorage.setItem("id", jwtData.id);
    localStorage.setItem("role", jwtData.role);

    return {
      success: true,
      token: jwtData.token,
      user: {
        id: jwtData.id,
        name: jwtData.name,
        email: jwtData.email,
        role: jwtData.role,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

async function register(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    const result = await readResponse(response);

    return response.ok
      ? { success: true, message: result.message || "Registration successful" }
      : { success: false, error: result.message || result.error || "Registration failed" };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

async function getUserDetails(email) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/users/details?email=${encodeURIComponent(email)}`,
      {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );
    const result = await readResponse(response);

    return response.ok
      ? { success: true, data: result }
      : { success: false, error: result.message || result.error || "Failed to fetch user details" };
  } catch (error) {
    console.error("Get user details error:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

function logout() {
  const headers = getAuthHeader();
  ["token", "email", "name", "id", "role"].forEach((key) => localStorage.removeItem(key));

  fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers,
  }).then((response) => {
    if (!response.ok) {
      console.error("Backend logout failed:", response.status);
    }
  }).catch((error) => {
    console.error("Logout error:", error);
  });
}

function isAdminAuthenticated() {
  return Boolean(localStorage.getItem("token")) && localStorage.getItem("role") === "ROLE_ADMIN";
}

function isUserAuthenticated() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  return Boolean(token) && (role === "ROLE_USER" || role === "ROLE_ADMIN");
}

function getCurrentUser() {
  return {
    token: localStorage.getItem("token"),
    id: localStorage.getItem("id"),
    name: localStorage.getItem("name"),
    email: localStorage.getItem("email"),
    role: localStorage.getItem("role"),
  };
}

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const authService = {
  login,
  register,
  getUserDetails,
  logout,
  isAdminAuthenticated,
  isUserAuthenticated,
  getCurrentUser,
  getAuthHeader,
};
