import React from "react";

export default function AlertsPanel({ escalations, notifications, refreshAlerts, createEscalation, resolveEscalation }) {
  return (
    <main className="main-area">
      <div className="main-header"><div className="main-title-block"><div className="main-title">Alerts + Escalation</div><div className="main-subtitle">Policy-driven alerts, escalation records, and operator notifications.</div></div></div>
      <div className="main-body two-column">
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row"><div className="panel-title">Escalations</div><span className="panel-tag">Operator</span></div>
            <div className="feedback-actions"><button className="secondary-btn" onClick={refreshAlerts}>Refresh</button><button className="primary-btn" onClick={createEscalation}>Trigger escalation</button></div>
            <div className="archive-list">
              {escalations.length === 0 ? <div className="inbox-placeholder">No escalations yet.</div> : escalations.map((item) => (
                <div key={item.escalation_id} className="inbox-card">
                  <div className="inbox-card-header"><div className="inbox-card-title">{item.title}</div><span className="meta-pill">{item.severity}</span></div>
                  <div className="inbox-brief">{item.reason}</div>
                  <div className="inbox-brief">Status: {item.status}</div>
                  {item.status !== "resolved" && <div className="feedback-actions"><button className="primary-btn small" onClick={() => resolveEscalation(item.escalation_id)}>Resolve</button></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row"><div className="panel-title">Notifications</div><span className="panel-tag">Console</span></div>
            <div className="archive-list">
              {notifications.length === 0 ? <div className="inbox-placeholder">No notifications yet.</div> : notifications.map((item) => (
                <div key={item.notification_id} className="inbox-card"><div className="inbox-card-title">{item.channel}</div><div className="inbox-brief">{item.message}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
