import Database from "better-sqlite3";
const db = new Database("cnvs-os.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS pipeline_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT UNIQUE,
    title TEXT NOT NULL,
    department TEXT,
    output_type TEXT,
    brief TEXT NOT NULL,
    knowledge_context TEXT,
    status TEXT DEFAULT 'Pending review',
    revision_needed INTEGER DEFAULT 0,
    feedback_notes TEXT,
    output_summary TEXT,
    output_payload TEXT,
    provider TEXT,
    model TEXT,
    created_at TEXT NOT NULL,
    approved_at TEXT
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS knowledge_base (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_dna TEXT,
    repos_json TEXT,
    last_updated TEXT
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS workflow_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT UNIQUE,
    job_type TEXT,
    title TEXT,
    status TEXT,
    attempts INTEGER DEFAULT 0,
    failure_type TEXT,
    failure_message TEXT,
    next_retry_ms INTEGER,
    related_run_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS scheduler_windows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    window_id TEXT UNIQUE,
    label TEXT,
    interval_ms INTEGER,
    enabled INTEGER DEFAULT 1,
    last_run_at TEXT,
    created_at TEXT NOT NULL
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS escalations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    escalation_id TEXT UNIQUE,
    title TEXT,
    severity TEXT,
    reason TEXT,
    status TEXT,
    source_type TEXT,
    source_id TEXT,
    created_at TEXT NOT NULL,
    resolved_at TEXT
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_id TEXT UNIQUE,
    channel TEXT,
    message TEXT,
    escalation_id TEXT,
    created_at TEXT NOT NULL
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS operators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operator_id TEXT UNIQUE,
    name TEXT,
    role TEXT,
    permissions_json TEXT,
    created_at TEXT NOT NULL
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE,
    actor TEXT,
    action TEXT,
    target TEXT,
    outcome TEXT,
    detail TEXT,
    created_at TEXT NOT NULL
  );
`);
export default db;
