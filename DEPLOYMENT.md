# Geonara — Deployment Guide for Railway, Render, Fly.io & Similar Platforms
#
# This project is a monorepo with two services:
#   1. backend/  — FastAPI (Python) API server
#   2. frontend/ — Next.js dashboard
#
# Both Dockerfiles support the dynamic PORT env var injected by PaaS platforms.

# ──────────────────────────────────────────────
# RAILWAY
# ──────────────────────────────────────────────
#
# Option A: Railway Dashboard (recommended)
#   1. Go to https://railway.app → New Project → Deploy from GitHub Repo
#   2. Select fitrianabila2025group/GeoNara
#   3. Railway will detect the monorepo. Create TWO services:
#      • Service "backend"  → Root Directory: backend/
#      • Service "frontend" → Root Directory: frontend/
#   4. Set environment variables on the backend service:
#      - AIS_API_KEY=your_aisstream_key (required)
#      - OPENSKY_CLIENT_ID=... (optional)
#      - OPENSKY_CLIENT_SECRET=... (optional)
#      - LTA_ACCOUNT_KEY=... (optional)
#      - CORS_ORIGINS=https://your-frontend.up.railway.app
#   5. Set environment variables on the frontend service:
#      - BACKEND_URL=http://backend.railway.internal:8000
#        (Railway private networking — or use the backend's public URL)
#   6. Deploy! Railway auto-assigns PORT and public URLs.
#
# Option B: Railway CLI
#   $ railway login
#   $ railway init
#   $ railway link
#   # Deploy backend
#   $ cd backend && railway up
#   # Deploy frontend
#   $ cd ../frontend && railway up
#
# ──────────────────────────────────────────────
# RENDER
# ──────────────────────────────────────────────
#
#   1. Go to https://render.com → New → Web Service (create two)
#   2. Backend service:
#      - Root Directory: backend/
#      - Environment: Docker
#      - Health Check Path: /api/live-data/fast
#      - Add env vars: AIS_API_KEY, CORS_ORIGINS, etc.
#   3. Frontend service:
#      - Root Directory: frontend/
#      - Environment: Docker
#      - Add env var: BACKEND_URL=https://your-backend.onrender.com
#
# ──────────────────────────────────────────────
# FLY.IO
# ──────────────────────────────────────────────
#
#   # Backend
#   $ cd backend
#   $ fly launch --name geonara-backend --dockerfile Dockerfile
#   $ fly secrets set AIS_API_KEY=your_key
#   $ fly deploy
#
#   # Frontend
#   $ cd ../frontend
#   $ fly launch --name geonara-frontend --dockerfile Dockerfile
#   $ fly secrets set BACKEND_URL=https://geonara-backend.fly.dev
#   $ fly deploy
#
# ──────────────────────────────────────────────
# COOLIFY / CAPROVER / DOKKU
# ──────────────────────────────────────────────
#
#   These platforms support docker-compose.yml directly.
#   Just point the platform at the repo root and it will use
#   the existing docker-compose.yml with no changes needed.
#   Set env vars (AIS_API_KEY, etc.) in the platform dashboard.
#
# ──────────────────────────────────────────────
# ENVIRONMENT VARIABLES REFERENCE
# ──────────────────────────────────────────────
#
# Backend (backend service):
#   PORT              — Auto-injected by platform (default: 8000)
#   AIS_API_KEY       — Required: aisstream.io API key for maritime tracking
#   OPENSKY_CLIENT_ID — Optional: OpenSky OAuth2 client ID
#   OPENSKY_CLIENT_SECRET — Optional: paired with client ID
#   LTA_ACCOUNT_KEY   — Optional: Singapore LTA CCTV cameras
#   CORS_ORIGINS      — Optional: comma-separated allowed origins
#
# Frontend (frontend service):
#   PORT              — Auto-injected by platform (default: 3000)
#   BACKEND_URL       — URL to reach the backend (default: http://localhost:8000)
#                       Use internal networking URL when available (e.g. Railway private networking)
