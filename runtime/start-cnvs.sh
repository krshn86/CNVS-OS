#!/usr/bin/env bash
set -e

echo "Starting CNVS OS local runtime..."

echo "1. Install backend dependencies if needed"
if [ -f backend/package.json ]; then
  (cd backend && npm install)
fi

echo "2. Install frontend dependencies if needed"
if [ -f frontend/package.json ]; then
  (cd frontend && npm install)
fi

echo "3. Start backend"
(cd backend && npm run dev) &
BACKEND_PID=$!

echo "4. Start frontend"
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "CNVS OS running. Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
wait
