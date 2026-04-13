export function shouldRunWindow(window) {
  if (!window?.enabled) return false;
  const now = Date.now();
  const intervalMs = window.interval_ms ?? window.intervalMs ?? 300000;
  const lastRunAt = window.last_run_at ?? window.lastRunAt;
  return !lastRunAt || now - new Date(lastRunAt).getTime() >= intervalMs;
}
export function buildSchedulerSnapshot(windows = []) {
  const enabled = windows.filter((window) => window.enabled === 1 || window.enabled === true).length;
  const due = windows.filter((window) => shouldRunWindow(window)).length;
  return { enabled, due, total: windows.length };
}
export function detectStalledJobs(jobs = [], thresholdMs = 300000) {
  const now = Date.now();
  return jobs.filter((job) => job.status === "running" && now - new Date(job.updated_at || job.updatedAt || job.created_at || job.createdAt).getTime() > thresholdMs);
}
