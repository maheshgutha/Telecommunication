# TeleCRM (AOTMS) — Complete Audit Report

**Audit Date:** 2026-06-07  
**Auditor:** Claude (Senior Full-Stack / Security / QA)  
**Codebase:** Telecommunication-main (MERN Stack)

---

## Executive Summary

TeleCRM is a call-centre CRM built with Express + MongoDB (backend) and React + Vite + Tailwind (frontend). The core lead lifecycle, auth, campaigns, leaderboard, and reporting are functional and well-structured. However several pages are stubs or use localStorage instead of the real database, critical security gaps exist, and a handful of logic bugs affect data integrity.

---

## Stats at a Glance

| Category | Count |
|---|---|
| Total Features Inventoried | 28 |
| Fully Working | 16 |
| Partially Working | 7 |
| Broken / Stub | 5 |
| Security Findings | 6 |
| Performance Findings | 4 |

---

## 1. Architecture Overview

```
backend/
  src/
    config/db.js          – Mongoose connection
    middleware/auth.js    – JWT protect + role authorize
    models/               – Campaign, Course, FollowUp, Lead, User
    routes/               – auth, campaigns, courses, followups, leads, reports, users
    server.js             – Express entry, CORS *, Morgan

frontend/
  src/
    context/AuthContext   – JWT storage in localStorage
    services/api.js       – Axios instance with interceptors
    pages/                – 18 page components
    components/Layout/    – Sidebar, Topbar, Layout
```

**Deployment:** Frontend is a Vite SPA served via the `/dist` build. Vite proxy (`/api → localhost:5000`) is assumed in dev. In production the frontend must proxy or use the absolute backend URL.

---

## 2. Security Findings

| # | Finding | Severity | Fix |
|---|---|---|---|
| S1 | `CORS: origin: '*'` — any origin can call the API | High | Restrict to frontend origin in production |
| S2 | `.env` committed to repo — MongoDB Atlas URI + JWT secret exposed | Critical | Add `.env` to `.gitignore`, rotate credentials |
| S3 | No rate limiting on `/api/auth/login` — brute-force risk | High | Add `express-rate-limit` |
| S4 | JWT secret `aotms_super_secret_jwt_key_2024` is weak & hardcoded fallback risk | Medium | Use a 256-bit random secret via env only |
| S5 | `PUT /api/leads/:id` has no ownership check — any logged-in user can update any lead | Medium | Add role/ownership guard |
| S6 | No input sanitisation against NoSQL injection in query params (e.g. `?status[$ne]=Won`) | Medium | Use `express-mongo-sanitize` |

---

## 3. Performance Findings

| # | Finding | Impact | Fix |
|---|---|---|---|
| P1 | `/api/reports/admin-analysis` runs 20+ sequential awaits including N+1 `User.findById` in loops | High | Use `$lookup` aggregation instead of Promise.all loops |
| P2 | `/api/leads/stats` (caller role) runs 10 aggregate pipelines per request | Medium | Cache or reduce pipelines |
| P3 | Lead `activities` array grows unbounded inside the Lead document (no pagination / archive) | Medium | Add a separate Activities collection or cap at 500 |
| P4 | Frontend `Dashboard.jsx` is 2207 lines — single monolithic component causes slow re-renders | Low | Split into sub-components |

---

## 4. Module-level Findings

### Fully Working ✅
- Login / Logout / JWT auth
- Lead CRUD (create, read, update, delete by super admin)
- Log Call, Add Note, Status Change on Lead
- Campaign CRUD (admin/super admin)
- Campaign Detail with live stats
- Leaderboard (day/week/month/year)
- Followups CRUD (Tasks page)
- Users CRUD (admin/super admin)
- Courses CRUD
- Reports – Admin Analysis dashboard
- Reports – Calls Summary
- Reports – User Analysis
- Lead Profile page
- Stale Leads page
- Team Operations page
- Dashboard (caller & admin views)

### Partially Working ⚠️
- **MyCalls** — fetches `/api/leads/my-calls` but "Call Now" logs call locally; `callDuration` always 0 (no timer)
- **AddLead / Edit Lead** — works but `courseInterest` multi-select sends array; backend `Lead.courseInterest` is a single ObjectId (type mismatch)
- **Tasks** — sends `type=todo` to followupsAPI but backend only stores one type; "To-Do" tab always empty
- **Leaderboard** — period filter maps `'all'` but backend only accepts `day|week|month|year`; `'all'` falls back to `week`
- **Reports** — UI exposes only a fraction of the rich `/api/reports/admin-analysis` data (peakHours, locationStats, sourceStats, notifications not rendered)
- **MessageTemplates** — hardcoded in-memory templates; no backend model/route; data lost on refresh
- **MyPreferences** — UI only; no backend persistence

### Broken / Stub 🔴
- **WhatsApp** — placeholder page, no integration
- **Blocklist** — uses `localStorage` only; no backend model or route; not shared across users
- **Lead Import (bulk)** — no route exists; mentioned in seed but not exposed
- **Lead Export** — no route or UI
- **Notifications** — data computed in admin-analysis but no dedicated notification center UI

