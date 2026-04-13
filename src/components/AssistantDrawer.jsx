import React from "react";

export default function AssistantDrawer({ open, suggestions, onClose }) {
  return (
    <aside className={"assistant-drawer" + (open ? "" : " hidden")}>
      <div className="assistant-header">
        <div>
          <div className="panel-title">Operator Assistant</div>
          <div className="assistant-sub">Suggested next moves based on current app state.</div>
        </div>
        <button className="btn-close" onClick={onClose}>Close</button>
      </div>
      <div className="assistant-suggestion-list">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="assistant-card">
            <div className="assistant-card-title">{suggestion.title}</div>
            <div className="assistant-card-desc">{suggestion.description}</div>
            <button className="secondary-btn small" onClick={suggestion.action}>Do this</button>
          </div>
        ))}
      </div>
    </aside>
  );
}
