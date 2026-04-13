# CNVS OS Operator Handoff

## What the operator needs

1. Node installed
2. Repository cloned locally
3. Frontend and backend env files created from templates
4. Startup command available
5. Basic health-check and login sequence documented

## First launch steps

1. Copy `.env.example` files into real `.env` files
2. Run startup script
3. Open frontend
4. Check API health
5. Login as Founder Operator
6. Verify first pipeline run

## Operational notes

- Use local data root for persistence
- Treat external drive as physically sensitive storage
- Do not store secrets in exported data folders
