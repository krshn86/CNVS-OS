export const DEFAULT_OPERATORS = [
  { operatorId: "op_founder", name: "Founder Operator", role: "founder", permissions: ["approve_runs", "resolve_escalations", "manage_settings", "recover_jobs"] },
  { operatorId: "op_ops", name: "Operations Lead", role: "ops", permissions: ["recover_jobs", "view_scheduler", "view_alerts"] },
  { operatorId: "op_editor", name: "Content Editor", role: "editor", permissions: ["approve_runs"] },
];
export function buildSession(operator) { return { token: `sess_${Date.now()}`, operator, createdAt: new Date().toISOString() }; }
export function hasPermission(operator, permission) { return Boolean(operator?.permissions?.includes(permission)); }
