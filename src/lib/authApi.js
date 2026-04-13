import { API_BASE_URL } from "./env";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed for ${path}`);
  }
  return response.json();
}

export const authApi = {
  listOperators: () => request("/api/auth/operators"),
  login: (operatorId) => request("/api/auth/login", { method: "POST", body: JSON.stringify({ operatorId }) }),
  getSession: () => request("/api/auth/session"),
  checkPermission: (permission) => request("/api/auth/check", { method: "POST", body: JSON.stringify({ permission }) }),
};
