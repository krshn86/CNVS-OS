import React from "react";

export default function SchedulerPanel({ scheduler, stalledJobs, windows, refreshStatus, createWindow, runWindow, createMockRunningJob }) {
  return (
    <main className="main-area">
      <div className="main-header">
        <div className="main-title-block">
          <div className="main-title">Scheduler + Watchdog</div>
          <div className="main-subtitle">Recurring automation windows and stalled-job monitoring.</div>
        </div>
      </div>
      <div className="main-body two-column">
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row"><div className="panel-title">Scheduler Snapshot</div><span className="panel-tag">Runtime</span></div>
            <div className="archive-list">
              <div className="inbox-card"><div className="inbox-card-title">Enabled windows</div><div className="inbox-brief">{scheduler.enabled || 0}</div></div>
              <div className="inbox-card"><div className="inbox-card-title">Due now</div><div className="inbox-brief">{scheduler.due || 0}</div></div>
              <div className="inbox-card"><div className="inbox-card-title">Total windows</div><div className="inbox-brief">{scheduler.total || 0}</div></div>
              <div className="inbox-card"><div className="inbox-card-title">Stalled jobs</div><div className="inbox-brief">{stalledJobs.length}</div></div>
            </div>
            <div className="feedback-actions"><button className="secondary-btn" onClick={refreshStatus}>Refresh</button><button className="primary-btn" onClick={createWindow}>Add window</button><button className="secondary-btn" onClick={createMockRunningJob}>Mock stalled job</button></div>
          </div>
        </div>
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row"><div className="panel-title">Automation Windows</div><span className="panel-tag">Watchdog</span></div>
            <div className="archive-list">
              {windows.length === 0 ? <div className="inbox-placeholder">No automation windows yet.</div> : windows.map((window) => (
                <div key={window.window_id} className="inbox-card">
                  <div className="inbox-card-header"><div className="inbox-card-title">{window.label}</div><span className="meta-pill">{window.enabled ? 'enabled' : 'paused'}</span></div>
                  <div className="inbox-brief">Interval: {Math.round((window.interval_ms || 0) / 60000)} min</div>
                  <div className="inbox-brief">Last run: {window.last_run_at || 'Never'}</div>
                  <div className="feedback-actions"><button className="primary-btn small" onClick={() => runWindow(window.window_id)}>Run now</button></div>
                </div>
              ))}
            </div>
            <div className="panel-header-row" style={{ marginTop: 16 }}><div className="panel-title">Stalled Jobs</div></div>
            <div className="archive-list">
              {stalledJobs.length === 0 ? <div className="inbox-placeholder">No stalled jobs detected.</div> : stalledJobs.map((job) => (
                <div key={job.job_id} className="inbox-card"><div className="inbox-card-title">{job.title}</div><div className="inbox-brief">Started: {job.created_at}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
