import React from "react";

export default function InboxPanel({ inboxItems, approveInboxItem, requestRevision, feedbackItemId, setFeedbackItemId, feedbackNotes, setFeedbackNotes }) {
  return (
    <main className="main-area">
      <div className="main-header">
        <div className="main-title-block">
          <div className="main-title">Inbox</div>
          <div className="main-subtitle">Persisted outputs waiting for review.</div>
        </div>
      </div>
      <div className="main-body">
        <div className="panel">
          <div className="panel-header-row">
            <div className="panel-title">Review Queue</div>
            <span className="panel-tag">{inboxItems.length} in review</span>
          </div>
          {inboxItems.length === 0 ? <div className="inbox-placeholder">No pending items.</div> : (
            <div className="inbox-list">
              {inboxItems.map((item) => (
                <div key={item.id} className="inbox-card">
                  <div className="inbox-card-header">
                    <div className="inbox-card-title">{item.title}</div>
                    <div className={item.revision_needed ? "badge-revision" : "badge-pending"}>{item.status}</div>
                  </div>
                  <div className="inbox-meta-row">
                    <span className="meta-pill">{item.department}</span>
                    <span className="meta-pill">{item.output_type}</span>
                  </div>
                  <div className="inbox-brief">{item.brief}</div>
                  {item.output_summary && <div className="output-summary">{item.output_summary}</div>}
                  <div className="inbox-actions-row">
                    <div className="inbox-actions-main">
                      <button className="primary-btn small" onClick={() => approveInboxItem(item.id)}>Approve</button>
                      <button className="secondary-btn small" onClick={() => setFeedbackItemId(item.id)}>Request revision</button>
                    </div>
                  </div>
                  {feedbackItemId === item.id && (
                    <div className="feedback-box">
                      <div className="field-label">Revision notes</div>
                      <textarea className="field-textarea" value={feedbackNotes} onChange={(e) => setFeedbackNotes(e.target.value)} />
                      <div className="feedback-actions">
                        <button className="secondary-btn small" onClick={() => setFeedbackItemId(null)}>Cancel</button>
                        <button className="primary-btn small" onClick={() => requestRevision(item.id, feedbackNotes)}>Save feedback</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
