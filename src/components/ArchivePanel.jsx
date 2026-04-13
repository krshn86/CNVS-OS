import React from "react";

export default function ArchivePanel({ archiveItems }) {
  return (
    <main className="main-area">
      <div className="main-header">
        <div className="main-title-block">
          <div className="main-title">Archive</div>
          <div className="main-subtitle">Approved outputs from persistent storage.</div>
        </div>
      </div>
      <div className="main-body">
        <div className="panel">
          <div className="panel-header-row">
            <div className="panel-title">Approved Library</div>
            <span className="panel-tag">{archiveItems.length} stored</span>
          </div>
          {archiveItems.length === 0 ? <div className="inbox-placeholder">No approved items yet.</div> : (
            <div className="archive-list">
              {archiveItems.map((item) => (
                <div key={item.id} className="inbox-card">
                  <div className="inbox-card-header">
                    <div className="inbox-card-title">{item.title}</div>
                    <span className="badge-approved">Approved</span>
                  </div>
                  <div className="inbox-meta-row">
                    <span className="meta-pill">{item.department}</span>
                    <span className="meta-pill">{item.output_type}</span>
                    <span className="meta-pill">Approved {item.approved_at || "-"}</span>
                  </div>
                  <div className="inbox-brief">{item.brief}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
