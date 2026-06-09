# Bug Fix Report — TeleCRM (AOTMS)

---

## BUG-01: courseInterest Type Mismatch (Lead Create/Edit)

**Description:** `Lead.courseInterest` is a single `ObjectId` ref, but the frontend `AddLead.jsx` sends it as an array `["id1"]`. Mongoose silently takes the first element in some versions but may throw validation errors or store wrong data.

**Root Cause:** Schema field is `ObjectId`, UI passes `[]` array.

**Solution:** In `AddLead.jsx`, extract single value before POST: `courseInterest: formData.courseInterest?.[0] || formData.courseInterest || ''`

**Files Modified:** `frontend/src/pages/AddLead.jsx`

---

## BUG-02: Leaderboard 'all' Period Crashes / Falls Back to Week

**Description:** Frontend `Leaderboard.jsx` passes period `'all'` to `/api/reports/leaderboard`. Backend only handles `day|week|month|year`. Unrecognised value causes `start` date to equal `new Date()` (current moment), returning 0 results.

**Root Cause:** Missing `'all'` case in backend period switch.

**Solution:** Add `else { start = new Date(0); }` catch-all in `reports.js` leaderboard route, OR map `'all'` → `'year'` on the frontend.

**Files Modified:** `backend/src/routes/reports.js` (fix applied below)

---

## BUG-03: Tasks "To-Do" Tab Always Empty

**Description:** Tasks page sends `type=todo` to `followupsAPI.getAll`. The `/api/followups` route has no `type` filter — it ignores the param. The FollowUp model has no `type` field. To-Do tab always returns empty.

**Root Cause:** Missing `type` field on FollowUp model and no filter in the route.

**Solution:** Add `type` field to FollowUp schema with enum `['call_followup', 'todo']` and apply filter in GET handler.

**Files Modified:** `backend/src/models/FollowUp.js`, `backend/src/routes/followups.js`

---

## BUG-04: Call Duration Never Recorded (Always 0)

**Description:** `POST /api/leads/:id/call` receives `duration` from the frontend but `MyCalls.jsx` passes `duration: 0` on every call log because there is no call timer.

**Root Cause:** No timer implemented in MyCalls call modal.

**Solution:** Add a call timer (seconds counter) that starts when "Call Now" is tapped and stops on "End Call / Log Call". Pass elapsed seconds as `duration`.

**Files Modified:** `frontend/src/pages/MyCalls.jsx`

---

## BUG-05: Blocklist Not Shared Across Users

**Description:** Blocklist uses `localStorage` only. Each browser/device has its own blocklist. No backend check when creating leads.

**Root Cause:** No Blocklist model or route. UI was built with localStorage as a placeholder.

**Solution:** 
1. Create `backend/src/models/Blocklist.js`
2. Create `backend/src/routes/blocklist.js` with GET/POST/DELETE
3. Register route in `server.js`
4. Update `Blocklist.jsx` to use API instead of localStorage
5. (Optional) Check phone against blocklist on lead creation

**Files Modified:** New files + `backend/src/server.js` + `frontend/src/pages/Blocklist.jsx`

---

## BUG-06: MessageTemplates Lost on Refresh

**Description:** Templates are stored in React state only. On page refresh all user-added templates are lost.

**Root Cause:** No backend model or API calls for templates.

**Solution:** Create `MessageTemplate` model and CRUD routes. Update `MessageTemplates.jsx` to fetch/save via API.

**Files Modified:** New model/route + `frontend/src/pages/MessageTemplates.jsx`

---

## BUG-07: No Delete Route for Campaigns

**Description:** Frontend has no "Delete Campaign" button but even if added, the backend has no `DELETE /api/campaigns/:id` route.

**Solution:** Add DELETE route to `campaigns.js` (super admin only).

**Files Modified:** `backend/src/routes/campaigns.js`

---

## BUG-08: PUT /api/leads/:id — No Ownership / Role Check

**Description:** Any authenticated user (including callers from different teams) can update any lead if they know the ID. No ownership check.

**Solution:** Add guard: if `req.user.role === 'caller'`, verify `lead.assignedTo.toString() === req.user._id.toString()`.

**Files Modified:** `backend/src/routes/leads.js`

---

## BUG-09: CORS Wildcard in Production

**Description:** `app.use(cors({ origin: '*' }))` allows any website to call the API with credentials.

**Solution:** Set `origin` from `process.env.FRONTEND_URL` and restrict in production.

**Files Modified:** `backend/src/server.js`

---

## BUG-10: No Rate Limiting on Auth Routes

**Description:** `/api/auth/login` has no rate limit, enabling brute-force attacks.

**Solution:** Install and apply `express-rate-limit` to auth routes (max 10 req / 15 min per IP).

**Files Modified:** `backend/src/server.js`, `backend/package.json`
