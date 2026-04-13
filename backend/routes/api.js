import express from "express";
import db from "../db/database.js";
import { DEFAULT_OPERATORS, buildSession, hasPermission } from "../services/authEngine.js";
import { generatePipelineOutput } from "../services/executionEngine.js";
import { buildMemoryContext, rankMemoryMatches } from "../services/memoryEngine.js";
import { classifyFailure, getRetryDelayMs, buildQueueSnapshot, retryJob } from "../services/workflowEngine.js";
import { shouldRunWindow, buildSchedulerSnapshot, detectStalledJobs } from "../services/schedulerEngine.js";
import { buildEscalationRecord, buildNotification } from "../services/alertEngine.js";
import { createAuditEvent, buildObservabilitySnapshot } from "../services/auditEngine.js";

let activeSession = null;
const router = express.Router();

for (const operator of DEFAULT_OPERATORS) {
  db.prepare("INSERT OR IGNORE INTO operators (operator_id, name, role, permissions_json, created_at) VALUES (?, ?, ?, ?, ?)").run(operator.operatorId, operator.name, operator.role, JSON.stringify(operator.permissions), new Date().toISOString());
}

function persistAudit(eventInput) {
  const event = createAuditEvent(eventInput);
  db.prepare("INSERT INTO audit_events (event_id, actor, action, target, outcome, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(event.eventId, event.actor, event.action, event.target, event.outcome, event.detail, event.createdAt);
  return event;
}

function persistEscalation(payload) {
  const escalation = buildEscalationRecord(payload);
  const notification = buildNotification(escalation);
  db.prepare("INSERT INTO escalations (escalation_id, title, severity, reason, status, source_type, source_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(escalation.escalationId, escalation.title, escalation.severity, escalation.reason, escalation.status, escalation.sourceType, escalation.sourceId, escalation.createdAt);
  db.prepare("INSERT INTO notifications (notification_id, channel, message, escalation_id, created_at) VALUES (?, ?, ?, ?, ?)").run(notification.notificationId, notification.channel, notification.message, notification.escalationId, notification.createdAt);
  persistAudit({ actor: activeSession?.operator?.name || "system", action: "create_escalation", target: escalation.sourceId || escalation.title, outcome: "logged", detail: escalation.reason });
  return { escalation, notification };
}

function denyWithAudit(permission, res, target = "system") {
  const allowed = hasPermission(activeSession?.operator, permission);
  if (!allowed) {
    persistAudit({ actor: activeSession?.operator?.name || "anonymous", action: `permission_check:${permission}`, target, outcome: "denied", detail: `Permission denied for ${permission}` });
    res.status(403).json({ ok: false, error: `Permission denied for ${permission}`, session: activeSession });
    return false;
  }
  return true;
}

router.get("/health", (_req, res) => res.json({ ok: true, storage: "sqlite", timestamp: new Date().toISOString(), session: activeSession }));
router.get("/auth/operators", (_req, res) => {
  const operators = db.prepare("SELECT * FROM operators ORDER BY id ASC").all().map((row) => ({ operatorId: row.operator_id, name: row.name, role: row.role, permissions: JSON.parse(row.permissions_json || '[]') }));
  res.json({ ok: true, operators });
});
router.post("/auth/login", (req, res) => {
  const { operatorId } = req.body || {};
  const row = db.prepare("SELECT * FROM operators WHERE operator_id = ?").get(operatorId);
  if (!row) return res.status(404).json({ ok: false, error: "Operator not found" });
  activeSession = buildSession({ operatorId: row.operator_id, name: row.name, role: row.role, permissions: JSON.parse(row.permissions_json || '[]') });
  persistAudit({ actor: activeSession.operator.name, action: "login", target: activeSession.operator.role, outcome: "allowed", detail: "Operator session started" });
  res.json({ ok: true, session: activeSession });
});
router.get("/auth/session", (_req, res) => res.json({ ok: true, session: activeSession }));
router.post("/auth/check", (req, res) => {
  const { permission } = req.body || {};
  const allowed = hasPermission(activeSession?.operator, permission);
  persistAudit({ actor: activeSession?.operator?.name || "anonymous", action: `permission_check:${permission}`, target: "runtime", outcome: allowed ? "allowed" : "denied", detail: `Permission check for ${permission}` });
  res.json({ ok: true, allowed, operator: activeSession?.operator || null });
});
router.get("/audit/events", (_req, res) => {
  const events = db.prepare("SELECT * FROM audit_events ORDER BY id DESC").all();
  res.json({ ok: true, events });
});
router.get("/audit/snapshot", (_req, res) => {
  const events = db.prepare("SELECT * FROM audit_events ORDER BY id DESC").all();
  res.json({ ok: true, snapshot: buildObservabilitySnapshot(events) });
});
router.get("/runs", (_req, res) => {
  const rows = db.prepare("SELECT * FROM pipeline_runs ORDER BY id DESC").all();
  res.json({ ok: true, results: rows.map((row) => ({ ...row, revision_needed: Boolean(row.revision_needed), output: row.output_payload ? JSON.parse(row.output_payload) : null })) });
});
router.post("/runs", async (req, res) => {
  const { title, department, outputType, brief, knowledgeContext, provider = process.env.MODEL_PROVIDER || "openai", model = process.env.DEFAULT_MODEL || "gpt-4.1-mini" } = req.body || {};
  if (!title || !brief) return res.status(400).json({ ok: false, error: "Missing title or brief" });
  const knowledgeRow = db.prepare("SELECT * FROM knowledge_base ORDER BY id DESC LIMIT 1").get();
  const latestRuns = db.prepare("SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT 5").all();
  const repos = knowledgeRow?.repos_json ? JSON.parse(knowledgeRow.repos_json) : [];
  const brandDNA = knowledgeContext || knowledgeRow?.brand_dna || "";
  const output = await generatePipelineOutput({ title, department, outputType, brief, knowledgeContext: brandDNA, provider, model, latestRuns, repos });
  const runId = `pip_${Date.now()}`;
  const jobId = `job_${Date.now()}`;
  const createdAt = new Date().toISOString();
  db.prepare(`INSERT INTO pipeline_runs (run_id, title, department, output_type, brief, knowledge_context, status, output_summary, output_payload, provider, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(runId, title, department || "Brand Studio", outputType || "Activation Pipeline", brief, brandDNA, "Pending review", output.summary, JSON.stringify(output), provider, model, createdAt);
  db.prepare(`INSERT INTO workflow_jobs (job_id, job_type, title, status, attempts, related_run_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(jobId, "pipeline_run", title, "pending", 0, runId, createdAt, createdAt);
  persistAudit({ actor: activeSession?.operator?.name || "system", action: "create_run", target: runId, outcome: "allowed", detail: `${title} created for ${department || 'Brand Studio'}` });
  res.json({ ok: true, runId, jobId, output, stages: [{ id: "intake", logs: ["Captured user request"] }, { id: "plan", logs: ["Assembled memory-aware execution payload"] }, { id: "draft", logs: [`Generated output with ${provider} / ${model}`] }, { id: "refine", logs: [brandDNA ? "Applied saved knowledge context" : "No saved knowledge context applied"] }, { id: "handoff", logs: ["Persisted AI output and enqueued workflow job"] }] });
});
router.post("/runs/:id/approve", (req, res) => {
  if (!denyWithAudit("approve_runs", res, `run:${req.params.id}`)) return;
  const approvedAt = new Date().toISOString();
  const result = db.prepare("UPDATE pipeline_runs SET status = 'Approved', approved_at = ? WHERE id = ?").run(approvedAt, req.params.id);
  persistAudit({ actor: activeSession?.operator?.name || "system", action: "approve_run", target: `run:${req.params.id}`, outcome: result.changes > 0 ? "allowed" : "noop", detail: "Run approval attempted" });
  res.json({ ok: true, updated: result.changes > 0, approvedAt, operator: activeSession?.operator || null });
});
router.post("/runs/:id/revise", (req, res) => {
  const { notes = "" } = req.body || {};
  const result = db.prepare("UPDATE pipeline_runs SET status = 'Needs revision', revision_needed = 1, feedback_notes = ? WHERE id = ?").run(notes, req.params.id);
  persistAudit({ actor: activeSession?.operator?.name || "system", action: "request_revision", target: `run:${req.params.id}`, outcome: result.changes > 0 ? "allowed" : "noop", detail: notes || "Revision requested" });
  res.json({ ok: true, updated: result.changes > 0 });
});
router.get("/knowledge", (_req, res) => {
  const row = db.prepare("SELECT * FROM knowledge_base ORDER BY id DESC LIMIT 1").get();
  res.json({ ok: true, knowledge: row ? { ...row, repos: row.repos_json ? JSON.parse(row.repos_json) : [] } : null });
});
router.post("/knowledge", (req, res) => {
  if (!denyWithAudit("manage_settings", res, "knowledge_base")) return;
  const { brandDNA = "", repos = [] } = req.body || {};
  const lastUpdated = new Date().toISOString();
  db.prepare("INSERT INTO knowledge_base (brand_dna, repos_json, last_updated) VALUES (?, ?, ?)").run(brandDNA, JSON.stringify(repos), lastUpdated);
  persistAudit({ actor: activeSession?.operator?.name || "system", action: "update_knowledge", target: "knowledge_base", outcome: "allowed", detail: "Brand DNA and repositories updated" });
  res.json({ ok: true, lastUpdated, operator: activeSession?.operator || null });
});
router.post("/memory/context", (_req, res) => {
  const knowledgeRow = db.prepare("SELECT * FROM knowledge_base ORDER BY id DESC LIMIT 1").get();
  const latestRuns = db.prepare("SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT 5").all();
  const repos = knowledgeRow?.repos_json ? JSON.parse(knowledgeRow.repos_json) : [];
  const memory = buildMemoryContext({ brandDNA: knowledgeRow?.brand_dna || "", repos, latestRuns });
  res.json({ ok: true, memory });
});
router.post("/memory/search", (req, res) => {
  const { query = "" } = req.body || {};
  const records = db.prepare("SELECT * FROM pipeline_runs ORDER BY id DESC").all();
  const results = rankMemoryMatches(query, records);
  res.json({ ok: true, results });
});
router.get("/workflow/queue", (_req, res) => {
  const jobs = db.prepare("SELECT * FROM workflow_jobs ORDER BY id DESC").all();
  res.json({ ok: true, snapshot: buildQueueSnapshot(jobs), jobs });
});
router.post("/workflow/queue/fail", (req, res) => {
  const { id, message = "Unknown error" } = req.body || {};
  const job = db.prepare("SELECT * FROM workflow_jobs WHERE job_id = ?").get(id);
  if (!job) return res.status(404).json({ ok: false, error: "Job not found" });
  const lane = classifyFailure(message);
  const nextStatus = lane === "retryable" ? "failed" : lane === "permanent" ? "dead-letter" : "failed";
  const nextRetryMs = lane === "retryable" ? getRetryDelayMs((job.attempts || 0) + 1) : null;
  db.prepare("UPDATE workflow_jobs SET status = ?, failure_type = ?, failure_message = ?, next_retry_ms = ?, updated_at = ? WHERE job_id = ?").run(nextStatus, lane, message, nextRetryMs, new Date().toISOString(), id);
  const updated = db.prepare("SELECT * FROM workflow_jobs WHERE job_id = ?").get(id);
  persistAudit({ actor: activeSession?.operator?.name || "system", action: "fail_job", target: updated.job_id, outcome: nextStatus, detail: updated.failure_message || "Workflow failure recorded" });
  let alertPayload = null;
  if (nextStatus === "dead-letter") alertPayload = persistEscalation({ title: `Dead-letter job: ${updated.title}`, reason: updated.failure_message || "Workflow entered dead-letter state", failureCount: (updated.attempts || 0) + 1, sourceType: "workflow_job", sourceId: updated.job_id });
  res.json({ ok: true, job: updated, alertPayload });
});
router.post("/workflow/queue/retry", (req, res) => {
  if (!denyWithAudit("recover_jobs", res, req.body?.id || "workflow_job")) return;
  const { id } = req.body || {};
  const job = db.prepare("SELECT * FROM workflow_jobs WHERE job_id = ?").get(id);
  if (!job) return res.status(404).json({ ok: false, error: "Job not found" });
  const retried = retryJob(job);
  db.prepare("UPDATE workflow_jobs SET attempts = ?, next_retry_ms = ?, status = ?, updated_at = ? WHERE job_id = ?").run(retried.attempts, retried.nextRetryMs, retried.status, new Date().toISOString(), id);
  const updated = db.prepare("SELECT * FROM workflow_jobs WHERE job_id = ?").get(id);
  const jobs = db.prepare("SELECT * FROM workflow_jobs ORDER BY id DESC").all();
  persistAudit({ actor: activeSession?.operator?.name || "system", action: "retry_job", target: updated.job_id, outcome: updated.status, detail: `Retry attempt ${updated.attempts}` });
  let alertPayload = null;
  if (updated.status === "dead-letter") alertPayload = persistEscalation({ title: `Retries exhausted: ${updated.title}`, reason: "Workflow exhausted retry budget", failureCount: updated.attempts, sourceType: "workflow_job", sourceId: updated.job_id });
  res.json({ ok: true, job: updated, snapshot: buildQueueSnapshot(jobs), alertPayload, operator: activeSession?.operator || null });
});
router.post("/workflow/queue/recover", (req, res) => {
  if (!denyWithAudit("recover_jobs", res, req.body?.id || "workflow_job")) return;
  const { id } = req.body || {};
  const job = db.prepare("SELECT * FROM workflow_jobs WHERE job_id = ?").get(id);
  if (!job) return res.status(404).json({ ok: false, error: "Job not found" });
  db.prepare("UPDATE workflow_jobs SET status = 'pending', failure_type = NULL, failure_message = NULL, next_retry_ms = NULL, updated_at = ? WHERE job_id = ?").run(new Date().toISOString(), id);
  const updated = db.prepare("SELECT * FROM workflow_jobs WHERE job_id = ?").get(id);
  const jobs = db.prepare("SELECT * FROM workflow_jobs ORDER BY id DESC").all();
  persistAudit({ actor: activeSession?.operator?.name || "system", action: "recover_job", target: updated.job_id, outcome: "allowed", detail: "Job moved back to pending" });
  res.json({ ok: true, job: updated, snapshot: buildQueueSnapshot(jobs), operator: activeSession?.operator || null });
});
router.get("/scheduler/status", (_req, res) => {
  const windows = db.prepare("SELECT * FROM scheduler_windows ORDER BY id DESC").all();
  const jobs = db.prepare("SELECT * FROM workflow_jobs ORDER BY id DESC").all();
  const stalledJobs = detectStalledJobs(jobs);
  stalledJobs.forEach((job) => {
    const existing = db.prepare("SELECT * FROM escalations WHERE source_type = 'workflow_job' AND source_id = ? AND status = 'open'").get(job.job_id);
    if (!existing) persistEscalation({ title: `Stalled job: ${job.title}`, reason: "Watchdog detected a stalled running job", stalled: true, sourceType: "workflow_job", sourceId: job.job_id });
  });
  const escalations = db.prepare("SELECT * FROM escalations ORDER BY id DESC").all();
  res.json({ ok: true, scheduler: buildSchedulerSnapshot(windows), stalledJobs, windows, jobs, openEscalations: escalations.filter((item) => item.status === 'open').length });
});
router.post("/scheduler/windows", (req, res) => {
  if (!denyWithAudit("manage_settings", res, "scheduler_window")) return;
  const { label = 'Default window', intervalMs = 300000, enabled = true } = req.body || {};
  const windowId = `win_${Date.now()}`;
  const createdAt = new Date().toISOString();
  db.prepare("INSERT INTO scheduler_windows (window_id, label, interval_ms, enabled, last_run_at, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(windowId, label, intervalMs, enabled ? 1 : 0, null, createdAt);
  const windows = db.prepare("SELECT * FROM scheduler_windows ORDER BY id DESC").all();
  const created = db.prepare("SELECT * FROM scheduler_windows WHERE window_id = ?").get(windowId);
  persistAudit({ actor: activeSession?.operator?.name || "system", action: "create_scheduler_window", target: created.window_id, outcome: "allowed", detail: created.label });
  res.json({ ok: true, window: created, scheduler: buildSchedulerSnapshot(windows), operator: activeSession?.operator || null });
});
router.post("/scheduler/windows/:id/run", (req, res) => {
  const window = db.prepare("SELECT * FROM scheduler_windows WHERE window_id = ?").get(req.params.id);
  if (!window) return res.status(404).json({ ok: false, error: "Window not found" });
  const now = new Date().toISOString();
  db.prepare("UPDATE scheduler_windows SET last_run_at = ? WHERE window_id = ?").run(now, req.params.id);
  const updated = db.prepare("SELECT * FROM scheduler_windows WHERE window_id = ?").get(req.params.id);
  persistAudit({ actor: activeSession?.operator?.name || "system", action: "run_scheduler_window", target: updated.window_id, outcome: "allowed", detail: "Window run triggered manually" });
  res.json({ ok: true, window: updated, due: shouldRunWindow(updated) });
});
router.post("/scheduler/jobs/mock-running", (req, res) => {
  const { title = 'Running workflow job', ageMs = 600000 } = req.body || {};
  const createdAt = new Date(Date.now() - ageMs).toISOString();
  const jobId = `job_${Date.now()}`;
  db.prepare("INSERT INTO workflow_jobs (job_id, job_type, title, status, attempts, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(jobId, 'watchdog_test', title, 'running', 0, createdAt, createdAt);
  const jobs = db.prepare("SELECT * FROM workflow_jobs ORDER BY id DESC").all();
  const job = db.prepare("SELECT * FROM workflow_jobs WHERE job_id = ?").get(jobId);
  persistAudit({ actor: activeSession?.operator?.name || "system", action: "create_mock_running_job", target: jobId, outcome: "allowed", detail: title });
  const stalledJobs = detectStalledJobs(jobs);
  if (stalledJobs.some((item) => item.job_id === jobId)) persistEscalation({ title: `Stalled job: ${title}`, reason: "Mock watchdog test created a stalled job", stalled: true, sourceType: "workflow_job", sourceId: jobId });
  res.json({ ok: true, job, stalledJobs });
});
router.get("/alerts/status", (_req, res) => {
  const escalations = db.prepare("SELECT * FROM escalations ORDER BY id DESC").all();
  const notifications = db.prepare("SELECT * FROM notifications ORDER BY id DESC").all();
  res.json({ ok: true, escalations, notifications });
});
router.post("/alerts/escalate", (req, res) => {
  const payload = persistEscalation(req.body || {});
  res.json({ ok: true, ...payload });
});
router.post("/alerts/resolve/:id", (req, res) => {
  if (!denyWithAudit("resolve_escalations", res, req.params.id)) return;
  const escalation = db.prepare("SELECT * FROM escalations WHERE escalation_id = ? OR CAST(id AS TEXT) = ?").get(req.params.id, req.params.id);
  if (!escalation) return res.status(404).json({ ok: false, error: "Escalation not found" });
  const resolvedAt = new Date().toISOString();
  db.prepare("UPDATE escalations SET status = 'resolved', resolved_at = ? WHERE (escalation_id = ? OR CAST(id AS TEXT) = ?)").run(resolvedAt, req.params.id, req.params.id);
  const updated = db.prepare("SELECT * FROM escalations WHERE escalation_id = ? OR CAST(id AS TEXT) = ?").get(req.params.id, req.params.id);
  persistAudit({ actor: activeSession?.operator?.name || "system", action: "resolve_escalation", target: updated.escalation_id, outcome: "allowed", detail: updated?.title || "Escalation resolved" });
  res.json({ ok: true, escalation: updated, operator: activeSession?.operator || null });
});
export default router;
