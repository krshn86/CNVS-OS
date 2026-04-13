import React from "react";

export default function AuditPanel({ events, snapshot, refreshAudit }) {
  return (
    <main className="main-area">
      <div className="main-header"><div className="main-title-block"><div className="main-title">Audit + Observability</div><div className="main-subtitle">Protected action history and runtime visibility.</div></div></div>
      <div className="main-body two-column">
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row"><div className="panel-title">Observability snapshot</div><span className="panel-tag">Metrics</span></div>
            <div className="feedback-actions"><button className="secondary-btn" onClick={refreshAudit}>Refresh</button></div>
            <div className="archive-list">
              <div className="inbox-card"><div className="inbox-card-title">Total events</div><div className="inbox-brief">{snapshot.totalEvents || 0}</div></div>
              <div className="inbox-card"><div className="inbox-card-title">Approvals</div><div className="inbox-brief">{snapshot.approvals || 0}</div></div>
              <div className="inbox-card"><div className="inbox-card-title">Denials</div><div className="inbox-brief">{snapshot.denials || 0}</div></div>
              <div className="inbox-card"><div className="inbox-card-title">Escalations</div><div className="inbox-brief">{snapshot.escalations || 0}</div></div>
              <div className="inbox-card"><div className="inbox-card-title">Recoveries</div><div className="inbox-brief">{snapshot.recoveries || 0}</div></div>
            </div>
          </div>
        </div>
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row"><div className="panel-title">Audit trail</div><span className="panel-tag">History</span></div>
            <div className="archive-list">
              {events.length === 0 ? <div className="inbox-placeholder">No audit events yet.</div> : events.map((event) => (
                <div key={event.event_id || event.eventId} className="inbox-card">
                  <div className="inbox-card-header"><div className="inbox-card-title">{event.action}</div><span className="meta-pill">{event.outcome}</span></div>
                  <div className="inbox-brief">Actor: {event.actor}</div>
                  <div className="inbox-brief">Target: {event.target}</div>
                  <div className="inbox-brief">{event.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
