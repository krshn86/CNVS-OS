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

export const workflowApi = {
  getQueue: () => request("/api/workflow/queue"),
  failJob: (payload) => request("/api/workflow/queue/fail", { method: "POST", body: JSON.stringify(payload) }),
  retryJob: (id) => request("/api/workflow/queue/retry", { method: "POST", body: JSON.stringify({ id }) }),
  recoverJob: (id) => request("/api/workflow/queue/recover", { method: "POST", body: JSON.stringify({ id }) }),
};
