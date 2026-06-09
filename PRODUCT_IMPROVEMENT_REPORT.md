# Product Improvement Report — TeleCRM (AOTMS)

---

## Missing Features vs Industry-Standard CRMs

| Priority | Gap | Effort | Value |
|---|---|---|---|
| 🔴 Critical | Lead Bulk Import (CSV/Excel) | Medium | Very High |
| 🔴 Critical | Lead Export (CSV) | Low | High |
| 🔴 Critical | Blocklist backed by database | Low | High |
| 🔴 Critical | Rate limiting on auth | Low | High |
| 🔴 Critical | Delete Campaign | Low | Medium |
| 🟠 High | Call Timer in MyCalls | Medium | High |
| 🟠 High | MessageTemplates persisted to DB | Medium | High |
| 🟠 High | Notifications Center UI | Medium | High |
| 🟠 High | Lead Import duplicate detection | Medium | High |
| 🟡 Medium | Audit Log (who changed what, when) | Medium | Medium |
| 🟡 Medium | User Preferences persisted | Low | Medium |
| 🟡 Medium | Lead Re-assignment history | Low | Medium |
| 🟡 Medium | Peak Hours Heatmap rendered in Reports | Low | Medium |
| 🟡 Medium | Source / Location stats in Reports | Low | Medium |
| 🟢 Low | WhatsApp Business integration | High | High |
| 🟢 Low | Email integration | High | Medium |
| 🟢 Low | Calendar sync for demos | High | Medium |
| 🟢 Low | Mobile push notifications | High | Medium |

---

## New Features Implemented in This Audit

### 1. Blocklist Model + API Routes
- `backend/src/models/Blocklist.js` — new collection
- `backend/src/routes/blocklist.js` — GET/POST/DELETE
- Updated `Blocklist.jsx` to use API

### 2. MessageTemplate Model + API Routes  
- `backend/src/models/MessageTemplate.js`
- `backend/src/routes/messageTemplates.js`
- Updated `MessageTemplates.jsx` to fetch/save

### 3. Lead Export (CSV)
- `GET /api/leads/export` — streams CSV
- Download button added to `Leads.jsx`

### 4. Delete Campaign
- `DELETE /api/campaigns/:id` added (super admin only)

### 5. FollowUp Task Type
- Added `type` field to FollowUp schema
- Tasks page To-Do tab now functional

### 6. Security Hardening
- Rate limiting on `/api/auth/*`
- `express-mongo-sanitize` added
- CORS restricted via `FRONTEND_URL` env var

### 7. Missing DB Indexes
- `followups.scheduledAt`, `followups.assignedTo`, `followups.status`
- `leads.lastCalledAt`

---

## Recommendations for Next Sprint

1. **Call Timer** — Add a stopwatch in `MyCalls.jsx`/`LeadProfile.jsx` that starts when a call begins and passes elapsed seconds to the log-call API. This will populate the `callDuration` field which currently always saves as 0.

2. **WhatsApp Integration** — Use the Baileys library (already familiar from the FreshMeat project) or the official WhatsApp Business API. Connect it to `MessageTemplates` so callers can send pre-approved templates directly from the Lead Profile.

3. **Lead Bulk Import** — Add a `POST /api/leads/import` route that accepts a multipart XLSX/CSV, parses it with the `xlsx` package (already in dependencies), deduplicates by phone, and bulk-inserts. Add a matching Import button in `Leads.jsx`.

4. **Audit Log** — Every status change, assignment, and delete already creates an activity on the lead. Extend this to a global `AuditLog` collection covering user management actions (create/edit/delete user, role changes) for compliance.

5. **Notification Center** — The admin-analysis API already computes `notifications[]`. Build a dropdown bell in the `Topbar` that polls this endpoint every 60 seconds or uses Socket.IO for real-time alerts.
