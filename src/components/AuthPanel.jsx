import React from "react";

export default function AuthPanel({ operators, session, loadOperators, loginAs, checkPermission, permissionCheck }) {
  return (
    <main className="main-area">
      <div className="main-header"><div className="main-title-block"><div className="main-title">Auth + Permissions</div><div className="main-subtitle">Operator identity, role visibility, and permission checks.</div></div></div>
      <div className="main-body two-column">
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row"><div className="panel-title">Operators</div><span className="panel-tag">Access</span></div>
            <div className="feedback-actions"><button className="secondary-btn" onClick={loadOperators}>Refresh operators</button></div>
            <div className="archive-list">
              {operators.length === 0 ? <div className="inbox-placeholder">No operators loaded yet.</div> : operators.map((operator) => (
                <div key={operator.operatorId} className="inbox-card">
                  <div className="inbox-card-header"><div className="inbox-card-title">{operator.name}</div><span className="meta-pill">{operator.role}</span></div>
                  <div className="inbox-brief">Permissions: {operator.permissions.join(", ")}</div>
                  <div className="feedback-actions"><button className="primary-btn small" onClick={() => loginAs(operator.operatorId)}>Login as {operator.role}</button></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row"><div className="panel-title">Session</div><span className="panel-tag">Runtime access</span></div>
            <div className="archive-list">
              {!session ? <div className="inbox-placeholder">No active session yet.</div> : <div className="inbox-card"><div className="inbox-card-title">{session.operator.name}</div><div className="inbox-brief">Role: {session.operator.role}</div><div className="inbox-brief">Session token: {session.token}</div></div>}
            </div>
            <div className="feedback-actions"><button className="secondary-btn" onClick={() => checkPermission("approve_runs")}>Check approve_runs</button><button className="secondary-btn" onClick={() => checkPermission("resolve_escalations")}>Check resolve_escalations</button></div>
            {permissionCheck && <div className="feedback-summary">Permission check: {permissionCheck.permission} → {permissionCheck.allowed ? "allowed" : "denied"}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
