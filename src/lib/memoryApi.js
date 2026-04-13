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

export const memoryApi = {
  buildContext: () => request("/api/memory/context", { method: "POST" }),
  searchMemory: (query) => request("/api/memory/search", { method: "POST", body: JSON.stringify({ query }) }),
};
