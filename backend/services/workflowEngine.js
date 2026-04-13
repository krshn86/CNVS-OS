export function classifyFailure(message = "") {
  const msg = message.toLowerCase();
  if (msg.includes("timeout") || msg.includes("rate limit") || msg.includes("temporar")) return "retryable";
  if (msg.includes("auth") || msg.includes("forbidden") || msg.includes("invalid")) return "permanent";
  if (msg.includes("dependency") || msg.includes("unavailable") || msg.includes("not found")) return "dependency";
  return "logic";
}
export function getRetryDelayMs(attemptNumber = 1) {
  const delays = [1500, 5000, 15000];
  return delays[Math.max(0, Math.min(attemptNumber - 1, delays.length - 1))];
}
export function buildQueueSnapshot(jobs = []) {
  const pending = jobs.filter((job) => job.status === "pending").length;
  const running = jobs.filter((job) => job.status === "running").length;
  const failed = jobs.filter((job) => job.status === "failed").length;
  const deadLetter = jobs.filter((job) => job.status === "dead-letter").length;
  return { pending, running, failed, deadLetter, total: jobs.length };
}
export function retryJob(job) {
  const nextAttempt = (job.attempts || 0) + 1;
  return { ...job, attempts: nextAttempt, nextRetryMs: getRetryDelayMs(nextAttempt), status: nextAttempt >= 3 ? "dead-letter" : "pending" };
}
