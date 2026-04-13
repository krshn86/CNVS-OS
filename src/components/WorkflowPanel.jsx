import React from "react";

export default function WorkflowPanel({ queueSnapshot, jobs, refreshQueue, retryJob, recoverJob }) {
  return (
    <main className="main-area">
      <div className="main-header">
        <div className="main-title-block">
          <div className="main-title">Workflow Control</div>
          <div className="main-subtitle">Queue health, failure lanes, retry state, and operator recovery.</div>
        </div>
      </div>
      <div className="main-body two-column">
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row">
              <div className="panel-title">Queue Snapshot</div>
              <span className="panel-tag">Live status</span>
            </div>
            <div className="archive-list">
              <div className="inbox-card"><div className="inbox-card-title">Pending</div><div className="inbox-brief">{queueSnapshot.pending || 0}</div></div>
              <div className="inbox-card"><div className="inbox-card-title">Running</div><div className="inbox-brief">{queueSnapshot.running || 0}</div></div>
              <div className="inbox-card"><div className="inbox-card-title">Failed</div><div className="inbox-brief">{queueSnapshot.failed || 0}</div></div>
              <div className="inbox-card"><div className="inbox-card-title">Dead-letter</div><div className="inbox-brief">{queueSnapshot.deadLetter || 0}</div></div>
            </div>
            <div className="feedback-actions"><button className="secondary-btn" onClick={refreshQueue}>Refresh</button></div>
          </div>
        </div>
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row">
              <div className="panel-title">Jobs</div>
              <span className="panel-tag">Operator view</span>
            </div>
            <div className="archive-list">
              {jobs.length === 0 ? <div className="inbox-placeholder">No jobs yet.</div> : jobs.map((job) => (
                <div key={job.job_id} className="inbox-card">
                  <div className="inbox-card-header"><div className="inbox-card-title">{job.title}</div><span className="meta-pill">{job.status}</span></div>
                  <div className="inbox-brief">Type: {job.job_type}</div>
                  <div className="inbox-brief">Attempts: {job.attempts || 0}</div>
                  {job.failure_type && <div className="feedback-summary">Failure: {job.failure_type} • {job.failure_message}</div>}
                  <div className="feedback-actions">
                    <button className="secondary-btn small" onClick={() => retryJob(job.job_id)}>Retry</button>
                    <button className="primary-btn small" onClick={() => recoverJob(job.job_id)}>Recover</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
