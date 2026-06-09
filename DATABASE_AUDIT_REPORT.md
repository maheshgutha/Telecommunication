# Database Audit Report — TeleCRM (AOTMS)

---

## Collections in Use

| Collection | Model File | Purpose |
|---|---|---|
| `users` | User.js | Callers, Admins, Super Admins |
| `leads` | Lead.js | Main CRM entity with embedded activities |
| `followups` | FollowUp.js | Scheduled follow-up tasks |
| `campaigns` | Campaign.js | Campaign groupings for leads |
| `courses` | Course.js | Course catalogue for interest/conversion |

---

## Schema Relationships

```
User ──< Lead (assignedTo)
User ──< Lead.activities (performedBy)
User ──< FollowUp (assignedTo)
User ──< Campaign (assignedCallers[], createdBy)
Lead >── Campaign
Lead >── Course (courseInterest)
Lead ──< FollowUp (lead ref)
```

---

## Indexes Defined

| Collection | Index |
|---|---|
| leads | phone, assignedTo, status, campaign |
| users | email (unique — via schema) |
| courses | name (unique — via schema) |

**Missing Indexes:**
- `followups.scheduledAt` — heavily used in date-range queries throughout reports
- `followups.assignedTo` — used in every caller-specific query
- `followups.status` — filtered on every list/report query
- `leads.lastCalledAt` — used in stale-lead detection
- `leads.updatedAt` — used in revenue and demo queries

---

## Missing Collections (features without DB backing)

| Feature | Status | Recommendation |
|---|---|---|
| Blocklist | Uses localStorage | Add `Blocklist` collection: `{phone, name, reason, blockedBy, blockedAt}` |
| MessageTemplates | In-memory state | Add `MessageTemplate` collection: `{type, shortcut, message, createdBy, shared}` |
| Notifications | Computed on-the-fly | Add `Notification` collection for persistence (optional — or keep computed) |
| UserPreferences | Not persisted | Add `preferences` sub-document to User schema |
| AuditLog | Not implemented | Add `AuditLog` collection for compliance |
| LeadImport | Not implemented | Handled by seed.js only; no production import route |

---

## Data Integrity Issues

1. **Lead.courseInterest** is a single `ObjectId` but the seed and UI send arrays in some places. Should enforce single-ref.
2. **FollowUp.status enum** includes `'late'` but the route never auto-transitions `upcoming` past-due entries to `'late'`. Stale `upcoming` records pile up.
3. **Campaign.totalLeads** field on the schema is never updated by the backend — it is always 0. The actual count is computed live via aggregation in the GET route. The stored field is misleading.
4. **Lead.activities** has no soft-limit; a single lead could accumulate thousands of embedded activity documents, causing document size issues (MongoDB 16 MB doc limit).

---

## Query Optimisation Recommendations

1. Add compound index `{assignedTo: 1, status: 1}` on leads — most caller queries filter by both.
2. Add compound index `{scheduledAt: 1, status: 1}` on followups.
3. Replace N+1 `User.findById` calls inside `Promise.all` loops in `reports.js` with `User.find({ _id: { $in: ids } })`.
4. Use `lean()` on read-only aggregate-fed queries to skip Mongoose hydration overhead.
5. Consider capping the embedded `activities` array to the most recent 500 entries and storing older entries in a separate `LeadActivities` collection.

---

## CRUD Verification

| Collection | Create | Read | Update | Delete |
|---|---|---|---|---|
| users | ✅ | ✅ | ✅ | ✅ (super admin) |
| leads | ✅ | ✅ | ✅ | ✅ (super admin) |
| followups | ✅ | ✅ | ✅ | ✅ |
| campaigns | ✅ | ✅ | ✅ | 🔴 No DELETE route |
| courses | ✅ | ✅ | ✅ | ✅ (super admin) |
