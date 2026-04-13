import React from "react";
import { API_BASE_URL, APP_ENV, MODEL_PROVIDER, DEFAULT_MODEL } from "../lib/env";

export default function SettingsPanel({ backendStatus, testBackendConnection }) {
  return (
    <main className="main-area">
      <div className="main-header">
        <div className="main-title-block">
          <div className="main-title">Settings</div>
          <div className="main-subtitle">Runtime configuration and backend status.</div>
        </div>
      </div>
      <div className="main-body two-column">
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row">
              <div className="panel-title">Environment</div>
              <span className="panel-tag">{APP_ENV}</span>
            </div>
            <div><div className="field-label">API base URL</div><input className="field-input" disabled value={API_BASE_URL} /></div>
            <div><div className="field-label">Model provider</div><input className="field-input" disabled value={MODEL_PROVIDER} /></div>
            <div><div className="field-label">Default model</div><input className="field-input" disabled value={DEFAULT_MODEL} /></div>
          </div>
        </div>
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row">
              <div className="panel-title">Backend Connection</div>
              <span className="panel-tag">{backendStatus}</span>
            </div>
            <div className="pipeline-controls">
              <button className="secondary-btn" onClick={testBackendConnection}>Test backend</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
