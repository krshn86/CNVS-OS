import React, { useState } from "react";

export default function MemoryPanel({ memorySnapshot, memoryResults, onBuildContext, onSearchMemory }) {
  const [query, setQuery] = useState("");
  return (
    <main className="main-area">
      <div className="main-header">
        <div className="main-title-block">
          <div className="main-title">Memory Fabric</div>
          <div className="main-subtitle">Build reusable context and search historical runs.</div>
        </div>
      </div>
      <div className="main-body two-column">
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row">
              <div className="panel-title">Context Snapshot</div>
              <span className="panel-tag">Memory</span>
            </div>
            <div className="pipeline-controls"><button className="primary-btn" onClick={onBuildContext}>Build context</button></div>
            <div className="output-summary">{memorySnapshot || "No memory snapshot built yet."}</div>
          </div>
        </div>
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row">
              <div className="panel-title">Historical Search</div>
              <span className="panel-tag">Runs</span>
            </div>
            <div>
              <div className="field-label">Search</div>
              <input className="field-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search saved runs" />
            </div>
            <div className="pipeline-controls"><button className="secondary-btn" onClick={() => onSearchMemory(query)}>Search memory</button></div>
            <div className="archive-list">
              {memoryResults.length === 0 ? <div className="inbox-placeholder">No matches yet.</div> : memoryResults.map((item) => (
                <div key={item.id} className="inbox-card">
                  <div className="inbox-card-title">{item.title}</div>
                  <div className="inbox-brief">{item.brief}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
