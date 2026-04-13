export function classifySeverity(input = {}) {
  if (input.failureCount >= 3 || input.stalled === true) return "critical";
  if (input.failureCount >= 1 || input.risk === "high") return "warning";
  return "info";
}
export function buildEscalationRecord(payload = {}) {
  return { escalationId: `esc_${Date.now()}`, title: payload.title || "Escalation", severity: classifySeverity(payload), reason: payload.reason || "Operator attention required", status: "open", sourceType: payload.sourceType || "system", sourceId: payload.sourceId || null, createdAt: new Date().toISOString() };
}
export function buildNotification(record = {}) {
  return { notificationId: `ntf_${Date.now()}`, channel: "operator_console", message: `${record.severity.toUpperCase()}: ${record.title} — ${record.reason}`, escalationId: record.escalationId, createdAt: new Date().toISOString() };
}
