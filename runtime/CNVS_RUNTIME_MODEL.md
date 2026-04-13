# CNVS OS Deployment + Runtime Finishing

## Runtime posture

CNVS OS should run as a local-first system with:
- one app root,
- one local data root,
- one explicit runtime loop,
- optional online connectors,
- optional later sync.

## Recommended structure

- `frontend/` — operator UI
- `backend/` — local API, workflow engine, persistence, audit, auth
- `runtime/` — launch scripts, env templates, startup helpers
- `data/` — SQLite database, exports, logs, archives

## Startup sequence

1. Load local environment config
2. Start backend runtime
3. Start frontend runtime
4. Verify health route
5. Verify data root exists
6. Verify audit, auth, alerts, workflow, and scheduler tables initialize

## External-drive-safe posture

- Assume removable storage can be lost or copied
- Keep secrets out of the data root
- Keep runtime startup explicit, not hidden
- Treat sync as optional and explicit later work

## What this batch is for

This batch is the finishing layer around the already-built internal runtime, so CNVS OS can be started and operated consistently instead of only existing as a set of technical modules.
