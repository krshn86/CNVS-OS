import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import PipelinePanel from "./components/PipelinePanel";
import InboxPanel from "./components/InboxPanel";
import ArchivePanel from "./components/ArchivePanel";
import KnowledgeBasePanel from "./components/KnowledgeBasePanel";
import SettingsPanel from "./components/SettingsPanel";
import AssistantDrawer from "./components/AssistantDrawer";
import MemoryPanel from "./components/MemoryPanel";
import WorkflowPanel from "./components/WorkflowPanel";
import SchedulerPanel from "./components/SchedulerPanel";
import AlertsPanel from "./components/AlertsPanel";
import AuthPanel from "./components/AuthPanel";
import AuditPanel from "./components/AuditPanel";
import { api } from "./lib/api";
import { memoryApi } from "./lib/memoryApi";
import { workflowApi } from "./lib/workflowApi";
import { schedulerApi } from "./lib/schedulerApi";
import { alertsApi } from "./lib/alertsApi";
import { authApi } from "./lib/authApi";
import { auditApi } from "./lib/auditApi";

const MODULES = ["Pipeline", "Inbox", "Archive", "Knowledge Base", "Memory Fabric", "Workflow Control", "Scheduler + Watchdog", "Alerts + Escalation", "Auth + Permissions", "Audit + Observability", "Settings"];
const INITIAL_STAGES = [
  { id: "intake", title: "Intake & Framing", description: "Capture the request and translate it into a clear brief." },
  { id: "plan", title: "Plan & Structure", description: "Break the request into stages and deliverables." },
  { id: "draft", title: "Generate Drafts", description: "Produce the first version of the requested outputs." },
  { id: "refine", title: "Refine & Align", description: "Polish outputs to match tone and constraints." },
  { id: "handoff", title: "Handoff to Inbox", description: "Push the completed output into the Inbox for review." },
];

function App() {
  const [activeModule, setActiveModule] = useState("Pipeline");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [department, setDepartment] = useState("Brand Studio");
  const [outputType, setOutputType] = useState("Activation Pipeline");
  const [brief, setBrief] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [logsByStage, setLogsByStage] = useState({});
  const [runs, setRuns] = useState([]);
  const [feedbackItemId, setFeedbackItemId] = useState(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [pipelineError, setPipelineError] = useState("");
  const [backendStatus, setBackendStatus] = useState("Unknown");
  const [knowledgeBase, setKnowledgeBase] = useState({ brandDNA: "", repos: ["", "", ""], lastUpdated: null });
  const [memorySnapshot, setMemorySnapshot] = useState("");
  const [memoryResults, setMemoryResults] = useState([]);
  const [queueSnapshot, setQueueSnapshot] = useState({});
  const [jobs, setJobs] = useState([]);
  const [scheduler, setScheduler] = useState({});
  const [windows, setWindows] = useState([]);
  const [stalledJobs, setStalledJobs] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [operators, setOperators] = useState([]);
  const [session, setSession] = useState(null);
  const [permissionCheck, setPermissionCheck] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [auditSnapshot, setAuditSnapshot] = useState({});

  const inboxItems = runs.filter((item) => item.status !== "Approved");
  const archiveItems = runs.filter((item) => item.status === "Approved");

  async function loadRuns() { const result = await api.listRuns(); setRuns(result.results || []); }
  async function loadKnowledge() { const result = await api.getKnowledge(); if (result.knowledge) setKnowledgeBase({ brandDNA: result.knowledge.brand_dna || "", repos: result.knowledge.repos?.length ? result.knowledge.repos : ["", "", ""], lastUpdated: result.knowledge.last_updated || null }); }
  async function testBackendConnection() { try { const health = await api.health(); setBackendStatus(health.ok ? "Connected" : "Unavailable"); setSession(health.session || null); } catch { setBackendStatus("Offline"); } }
  async function refreshQueue() { const result = await workflowApi.getQueue(); setQueueSnapshot(result.snapshot || {}); setJobs(result.jobs || []); }
  async function refreshScheduler() { const result = await schedulerApi.getStatus(); setScheduler(result.scheduler || {}); setWindows(result.windows || []); setStalledJobs(result.stalledJobs || []); }
  async function refreshAlerts() { const result = await alertsApi.getStatus(); setEscalations(result.escalations || []); setNotifications(result.notifications || []); }
  async function loadOperators() { const result = await authApi.listOperators(); setOperators(result.operators || []); }
  async function loadSession() { const result = await authApi.getSession(); setSession(result.session || null); }
  async function refreshAudit() { const [eventsResult, snapshotResult] = await Promise.all([auditApi.getEvents(), auditApi.getSnapshot()]); setAuditEvents(eventsResult.events || []); setAuditSnapshot(snapshotResult.snapshot || {}); }

  useEffect(() => {
    testBackendConnection();
    loadRuns().catch(() => {});
    loadKnowledge().catch(() => {});
    refreshQueue().catch(() => {});
    refreshScheduler().catch(() => {});
    refreshAlerts().catch(() => {});
    loadOperators().catch(() => {});
    loadSession().catch(() => {});
    refreshAudit().catch(() => {});
  }, []);

  async function loginAs(operatorId) { await authApi.login(operatorId); await loadSession(); await testBackendConnection(); await refreshAudit(); }
  async function checkPermission(permission) { const result = await authApi.checkPermission(permission); setPermissionCheck({ permission, allowed: result.allowed }); await refreshAudit(); }

  async function startPipelineRun() {
    if (!taskTitle.trim() || !brief.trim()) return;
    setIsRunning(true); setPipelineError("");
    try {
      const result = await api.createRun({ title: taskTitle, department, outputType, brief, knowledgeContext: knowledgeBase.brandDNA });
      const nextLogs = {};
      (result.stages || []).forEach((stage) => { nextLogs[stage.id] = stage.logs || []; });
      setLogsByStage(nextLogs);
      await loadRuns(); await refreshQueue(); await refreshScheduler(); await refreshAlerts(); await refreshAudit(); setActiveModule("Inbox");
    } catch (error) { setPipelineError(error.message || "Pipeline run failed"); }
    finally { setIsRunning(false); }
  }

  async function approveInboxItem(itemId) { try { await api.approveRun(itemId); await loadRuns(); await refreshAudit(); setActiveModule("Archive"); } catch (error) { setPipelineError(error.message || "Approval blocked"); await refreshAudit(); } }
  async function requestRevision(itemId, notes) { await api.reviseRun(itemId, notes); setFeedbackItemId(null); setFeedbackNotes(""); await loadRuns(); await refreshAudit(); }
  async function saveBrandDNA() { try { await api.saveKnowledge({ brandDNA: knowledgeBase.brandDNA, repos: knowledgeBase.repos.filter(Boolean) }); await loadKnowledge(); await refreshAudit(); } catch (error) { setPipelineError(error.message || "Settings update blocked"); await refreshAudit(); } }
  async function buildContext() { const result = await memoryApi.buildContext(); setMemorySnapshot(result.memory?.knowledgeSnapshot || ""); }
  async function searchMemory(query) { const result = await memoryApi.searchMemory(query); setMemoryResults(result.results || []); }
  async function retryJob(id) { try { await workflowApi.retryJob(id); await refreshQueue(); await refreshScheduler(); await refreshAlerts(); await refreshAudit(); } catch (error) { setPipelineError(error.message || "Retry blocked"); await refreshAudit(); } }
  async function recoverJob(id) { try { await workflowApi.recoverJob(id); await refreshQueue(); await refreshScheduler(); await refreshAudit(); } catch (error) { setPipelineError(error.message || "Recovery blocked"); await refreshAudit(); } }
  async function createWindow() { try { await schedulerApi.createWindow({ label: "Recurring automation window", intervalMs: 300000, enabled: true }); await refreshScheduler(); await refreshAudit(); } catch (error) { setPipelineError(error.message || "Scheduler update blocked"); await refreshAudit(); } }
  async function runWindow(id) { await schedulerApi.runWindow(id); await refreshScheduler(); await refreshAlerts(); await refreshAudit(); }
  async function createMockRunningJob() { await schedulerApi.createMockRunningJob({ title: "Stalled connector sync", ageMs: 600000 }); await refreshQueue(); await refreshScheduler(); await refreshAlerts(); await refreshAudit(); }
  async function createEscalation() { await alertsApi.escalate({ title: "Manual operator escalation", reason: "Manual test escalation", risk: "high", sourceType: "operator_console", sourceId: "manual" }); await refreshAlerts(); await refreshAudit(); }
  async function resolveEscalation(id) { try { await alertsApi.resolveEscalation(id); await refreshAlerts(); await refreshAudit(); } catch (error) { setPipelineError(error.message || "Escalation resolution blocked"); await refreshAudit(); } }

  function renderStageStatus(idx) { const stage = INITIAL_STAGES[idx]; return logsByStage[stage.id]?.length ? "complete" : "queued"; }

  const suggestions = useMemo(() => {
    const list = [];
    if (!session) list.push({ id: "login-founder", title: "Start operator session", description: "Open Auth + Permissions and login as Founder Operator", action: () => setActiveModule("Auth + Permissions") });
    else {
      const openEscalation = escalations.find((item) => item.status === "open");
      if (openEscalation) list.push({ id: "review-alerts", title: "Resolve open escalation", description: `Review ${openEscalation.title} in Alerts + Escalation`, action: () => setActiveModule("Alerts + Escalation") });
      else if (stalledJobs.length > 0) list.push({ id: "review-stalled", title: "Review stalled jobs", description: "Open Scheduler + Watchdog to inspect delayed runtime work", action: () => setActiveModule("Scheduler + Watchdog") });
      else if (jobs.some((job) => job.status === "failed" || job.status === "dead-letter")) list.push({ id: "review-queue", title: "Review workflow failures", description: "Open Workflow Control to inspect and recover failed jobs", action: () => setActiveModule("Workflow Control") });
      else if (inboxItems.length > 0) list.push({ id: "approve-latest", title: "Approve latest item", description: `Move ${inboxItems[0].title} to Archive`, action: () => approveInboxItem(inboxItems[0].id) });
      else list.push({ id: "run-first", title: "Create a new run", description: "Start a persistent audit-aware workflow run", action: () => setActiveModule("Pipeline") });
    }
    list.push({ id: "open-audit", title: "Review audit trail", description: "Inspect protected action history and denials", action: () => setActiveModule("Audit + Observability") });
    return list;
  }, [runs, jobs, stalledJobs, escalations, session]);

  let mainContent;
  if (activeModule === "Pipeline") mainContent = <PipelinePanel taskTitle={taskTitle} setTaskTitle={setTaskTitle} department={department} setDepartment={setDepartment} outputType={outputType} setOutputType={setOutputType} brief={brief} setBrief={setBrief} isRunning={isRunning} pipelineError={pipelineError} startPipelineRun={startPipelineRun} stages={INITIAL_STAGES} logsByStage={logsByStage} renderStageStatus={renderStageStatus} backendStatus={backendStatus} />;
  else if (activeModule === "Inbox") mainContent = <InboxPanel inboxItems={inboxItems} approveInboxItem={approveInboxItem} requestRevision={requestRevision} feedbackItemId={feedbackItemId} setFeedbackItemId={setFeedbackItemId} feedbackNotes={feedbackNotes} setFeedbackNotes={setFeedbackNotes} />;
  else if (activeModule === "Archive") mainContent = <ArchivePanel archiveItems={archiveItems} />;
  else if (activeModule === "Knowledge Base") mainContent = <KnowledgeBasePanel knowledgeBase={knowledgeBase} setKnowledgeBase={setKnowledgeBase} saveBrandDNA={saveBrandDNA} />;
  else if (activeModule === "Memory Fabric") mainContent = <MemoryPanel memorySnapshot={memorySnapshot} memoryResults={memoryResults} onBuildContext={buildContext} onSearchMemory={searchMemory} />;
  else if (activeModule === "Workflow Control") mainContent = <WorkflowPanel queueSnapshot={queueSnapshot} jobs={jobs} refreshQueue={refreshQueue} retryJob={retryJob} recoverJob={recoverJob} />;
  else if (activeModule === "Scheduler + Watchdog") mainContent = <SchedulerPanel scheduler={scheduler} stalledJobs={stalledJobs} windows={windows} refreshStatus={refreshScheduler} createWindow={createWindow} runWindow={runWindow} createMockRunningJob={createMockRunningJob} />;
  else if (activeModule === "Alerts + Escalation") mainContent = <AlertsPanel escalations={escalations} notifications={notifications} refreshAlerts={refreshAlerts} createEscalation={createEscalation} resolveEscalation={resolveEscalation} />;
  else if (activeModule === "Auth + Permissions") mainContent = <AuthPanel operators={operators} session={session} loadOperators={loadOperators} loginAs={loginAs} checkPermission={checkPermission} permissionCheck={permissionCheck} />;
  else if (activeModule === "Audit + Observability") mainContent = <AuditPanel events={auditEvents} snapshot={auditSnapshot} refreshAudit={refreshAudit} />;
  else mainContent = <SettingsPanel backendStatus={backendStatus} testBackendConnection={testBackendConnection} />;

  return <div className="app-root"><div className="app-shell"><header className="topbar"><div className="logo-pill"><div className="logo-mark"><div className="logo-mark-inner" /></div><div className="logo-text"><div className="logo-title">CNVS OS</div><div className="logo-sub">Audit Merged Stack</div></div></div><div className="topbar-right"><button className={"assistant-toggle" + (assistantOpen ? " active" : "")} onClick={() => setAssistantOpen((prev) => !prev)}>Operator Assistant</button><div className="badge-connection"><span>API</span><span>{backendStatus}</span></div></div></header><div className="app-inner"><aside className="sidebar"><div className="sidebar-content"><div className="sidebar-group-label">Modules</div><ul className="nav-list">{MODULES.map((m) => (<li key={m}><button className={"nav-item-btn" + (activeModule === m ? " active" : "")} onClick={() => setActiveModule(m)}><div className="nav-item-main"><span className="nav-dot" /><span className="nav-label">{m}</span></div></button></li>))}</ul></div></aside>{mainContent}<AssistantDrawer open={assistantOpen} suggestions={suggestions} onClose={() => setAssistantOpen(false)} /></div></div></div>;
}

export default App;
