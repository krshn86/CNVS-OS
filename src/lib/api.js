import { API_BASE_URL } from "./env";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed for ${path}`);
  }

  return response.json();
}

export const api = {
  health: () => request("/api/health"),
  listRuns: () => request("/api/runs"),
  createRun: (payload) => request("/api/runs", { method: "POST", body: JSON.stringify(payload) }),
  approveRun: (id) => request(`/api/runs/${id}/approve`, { method: "POST" }),
  reviseRun: (id, notes) => request(`/api/runs/${id}/revise`, { method: "POST", body: JSON.stringify({ notes }) }),
  getKnowledge: () => request("/api/knowledge"),
  saveKnowledge: (payload) => request("/api/knowledge", { method: "POST", body: JSON.stringify(payload) }),
};
