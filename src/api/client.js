// API CLIENT
// Purpose: Base configuration for all API requests
// All requests go through this file — token management is handled here

const BASE_URL = "http://127.0.0.1:8000";

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

// Main request function
export const apiRequest = async (method, endpoint, body = null) => {
  const headers = {
    "Content-Type": "application/json",
  };

  // Add token if available
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  // If unauthorized, clear token and redirect to login
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    throw new Error(data.detail || "Bir hata olustu.");
  }

  return data;
};

export const get = (endpoint) => apiRequest("GET", endpoint);
export const post = (endpoint, body) => apiRequest("POST", endpoint, body);
export const patch = (endpoint, body) => apiRequest("PATCH", endpoint, body);