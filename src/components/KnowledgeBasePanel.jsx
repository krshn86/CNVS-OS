import React from "react";

export default function KnowledgeBasePanel({ knowledgeBase, setKnowledgeBase, saveBrandDNA }) {
  return (
    <main className="main-area">
      <div className="main-header">
        <div className="main-title-block">
          <div className="main-title">Knowledge Base</div>
          <div className="main-subtitle">Persist brand DNA and repo sources.</div>
        </div>
      </div>
      <div className="main-body two-column">
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row">
              <div className="panel-title">Brand DNA</div>
              <span className="panel-tag">{knowledgeBase.lastUpdated || "Not saved yet"}</span>
            </div>
            <div>
              <div className="field-label">Operating context</div>
              <textarea className="field-textarea kb-textarea" value={knowledgeBase.brandDNA} onChange={(e) => setKnowledgeBase((prev) => ({ ...prev, brandDNA: e.target.value }))} />
            </div>
            <div className="pipeline-controls">
              <button className="primary-btn" onClick={saveBrandDNA}>Save Brand DNA</button>
            </div>
          </div>
        </div>
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row">
              <div className="panel-title">GitHub Sources</div>
              <span className="panel-tag">3 slots</span>
            </div>
            <div className="repo-list">
              {knowledgeBase.repos.map((repo, index) => (
                <div key={index}>
                  <div className="field-label">Repo {index + 1}</div>
                  <input className="field-input" value={repo} onChange={(e) => {
                    const next = [...knowledgeBase.repos];
                    next[index] = e.target.value;
                    setKnowledgeBase((prev) => ({ ...prev, repos: next }));
                  }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
