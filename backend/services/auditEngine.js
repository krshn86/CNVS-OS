export function createAuditEvent({ actor = "system", action = "unknown", target = "unknown", outcome = "logged", detail = "" }) {
  return { eventId: `evt_${Date.now()}`, actor, action, target, outcome, detail, createdAt: new Date().toISOString() };
}
export function buildObservabilitySnapshot(events = []) {
  const approvals = events.filter((item) => item.action === "approve_run").length;
  const denials = events.filter((item) => item.outcome === "denied").length;
  const escalations = events.filter((item) => item.action === "create_escalation").length;
  const recoveries = events.filter((item) => item.action === "recover_job").length;
  return { totalEvents: events.length, approvals, denials, escalations, recoveries };
}
