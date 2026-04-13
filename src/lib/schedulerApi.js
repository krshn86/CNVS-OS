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

export const schedulerApi = {
  getStatus: () => request("/api/scheduler/status"),
  createWindow: (payload) => request("/api/scheduler/windows", { method: "POST", body: JSON.stringify(payload) }),
  runWindow: (id) => request(`/api/scheduler/windows/${id}/run`, { method: "POST" }),
  createMockRunningJob: (payload) => request("/api/scheduler/jobs/mock-running", { method: "POST", body: JSON.stringify(payload) }),
};
