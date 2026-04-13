import React from "react";

function StagePill({ status }) {
  if (status === "running") return <span className="status-pill status-running">Running</span>;
  if (status === "complete") return <span className="status-pill status-done">Complete</span>;
  return <span className="status-pill status-waiting">Queued</span>;
}

export default function PipelinePanel(props) {
  const {
    taskTitle, setTaskTitle, department, setDepartment, outputType, setOutputType,
    brief, setBrief, isRunning, pipelineError, startPipelineRun, stages, logsByStage, renderStageStatus, backendStatus
  } = props;

  return (
    <main className="main-area">
      <div className="main-header">
        <div className="main-title-block">
          <div className="main-title">Pipeline Engine</div>
          <div className="main-subtitle">Create and persist production runs.</div>
        </div>
      </div>
      <div className="main-body two-column">
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row">
              <div className="panel-title">New Task Intake</div>
              <span className="panel-tag">Backend {backendStatus}</span>
            </div>
            <div className="pipeline-form-row">
              <div className="pipeline-form-main">
                <div>
                  <div className="field-label">Task title</div>
                  <input className="field-input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                </div>
                <div>
                  <div className="field-label">Short brief</div>
                  <textarea className="field-textarea" value={brief} onChange={(e) => setBrief(e.target.value)} />
                </div>
              </div>
              <div className="pipeline-form-side">
                <div>
                  <div className="field-label">Department</div>
                  <select className="field-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option>Brand Studio</option>
                    <option>Growth & Performance</option>
                    <option>Product Marketing</option>
                    <option>Design Systems</option>
                  </select>
                </div>
                <div>
                  <div className="field-label">Output type</div>
                  <select className="field-select" value={outputType} onChange={(e) => setOutputType(e.target.value)}>
                    <option>Activation Pipeline</option>
                    <option>Campaign Toolkit</option>
                    <option>Board-Room Pack</option>
                    <option>Asset Production Flow</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="pipeline-controls">
              <button className="primary-btn" onClick={startPipelineRun} disabled={isRunning}>Run Pipeline</button>
            </div>
            {pipelineError && <div className="error-box">{pipelineError}</div>}
          </div>
        </div>
        <div className="panel-column">
          <div className="panel">
            <div className="panel-header-row">
              <div className="panel-title">Execution Stages</div>
              <span className="panel-tag">Persistent</span>
            </div>
            <div className="pipeline-stages">
              {stages.map((stage, idx) => {
                const logs = logsByStage[stage.id] || [];
                return (
                  <div className="stage-card" key={stage.id}>
                    <div className="stage-row">
                      <div className="stage-main">
                        <div className="stage-index">{idx + 1}</div>
                        <div>
                          <div className="stage-title">{stage.title}</div>
                          <div className="stage-desc">{stage.description}</div>
                        </div>
                      </div>
                      <StagePill status={renderStageStatus(idx)} />
                    </div>
                    {logs.length > 0 && <div className="stage-logs">{logs.map((line, i) => <div className="log-line" key={i}>{line}</div>)}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
