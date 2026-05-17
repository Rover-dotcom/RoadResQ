# RoadResQ — Week 5 Backend Report
**Version:** v6.0.0 | **Deployed:** Firebase Cloud Functions | **Region:** me-central1 (Doha, Qatar)
**Date Completed:** 2026-05-06 | Firebase: Deployed | GitHub: Pushed | Postman: Updated

---

## Live Links

| Resource | URL |
|---|---|
| **Live API** | https://api-h6acdw3itq-ww.a.run.app |
| **Firebase Console** | https://console.firebase.google.com/project/roadresq-bd6b0/overview |
| **GitHub Branch** | https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev |
| **Postman Collection** | `/api/RoadResQ_API_v4_Complete.postman_collection.json` |

---

## Completion Checklist

| Task | Status |
|---|---|
| Job finalization flow (atomic: report + payment + cleanup + audit) | Done |
| Payment escrow engine (hold -> release -> refund) | Done |
| Report generation (JSON reports with timeline, payment, safety data) | Done |
| Automated file cleanup (3x retry, 24h soft-delete, storage monitoring) | Done |
| Audit logging engine (20+ event types, queryable) | Done |
| Role-separated dashboards (admin, driver, user, garage) | Done |
| Service-specific safety checklists (tow, heavy, garage, industrial) | Done |
| Firestore security rules for 6 new collections | Done |
| Firestore composite indexes (11 new) | Done |
| Postman collection updated to v6.0 | Done |

---

## Key Highlights

- Job completion is atomic — report, payment, cleanup, and audit happen in one batch (`backend/controllers/completionController.js`)
- Escrow state machine prevents double-release and blocks payout during disputes (`backend/utils/paymentEngine.js`)
- Cleanup retries 3 times with exponential backoff before logging failure (`backend/utils/cleanupEngine.js`)
- Every system action is audit-logged with actor, entity, and timestamp (`backend/utils/auditEngine.js`)
- Admin, driver, user, and garage dashboards are fully separated — no cross-contamination (`backend/controllers/dashboardController.js`)
- Safety checklists are service-specific — tow drivers check straps, heavy equipment checks boom position (`backend/utils/safetyEngine.js`)

---

## File Structure

### New Engines (`backend/utils/`)
| File | What It Does |
|---|---|
| `paymentEngine.js` | Escrow state machine: hold at dispatch, release on completion, refund on cancel, block during disputes |
| `reportEngine.js` | Generates comprehensive JSON reports with timeline, payment summary, safety data, and GPS trail |
| `cleanupEngine.js` | 3x retry file deletion with exponential backoff, 24h soft-delete grace period, storage usage alerts |
| `auditEngine.js` | Central event logger for all system actions, 20+ event types, queryable by type/entity/actor |

### New Controllers (`backend/controllers/`)
| File | What It Does |
|---|---|
| `completionController.js` | Atomic job finalization: prerequisites check, report generation, escrow release, file cleanup, audit log |
| `dashboardController.js` | Role-separated dashboards for admin, driver, user, and garage — each returns only their own data |

### New Routes (`backend/routes/`)
| File | Base Path |
|---|---|
| `completionRoutes.js` | `/api/completion` |
| `dashboardRoutes.js` | `/api/dashboard` |

### Modified Files
| File | What Changed |
|---|---|
| `backend/server.js` | v6.0.0 — registered completion and dashboard routes |
| `backend/utils/safetyEngine.js` | Added service-specific safety checklists (tow, heavy, garage, industrial) |
| `backend/controllers/safetyController.js` | 3 new endpoints for checklists |
| `backend/routes/safetyRoutes.js` | Checklist routes |
| `firestore.rules` | Rules for `payments`, `reports`, `audit_logs`, `pending_deletions`, `deletion_failures`, `safety_checklists` |
| `firestore.indexes.json` | 11 composite indexes for dashboard and completion queries |
| `functions/index.js` | Synced with backend — registered new routes |

---

## Payment Escrow System (`backend/utils/paymentEngine.js`)

When a driver is dispatched, the customer's payment is held in escrow. The payment cannot be released until the job is fully completed with all prerequisites (safety check + PIN verification). If a dispute is active, payment release is blocked until the dispute is resolved.

**State machine:**
```
pending -> held (at dispatch)
held -> released (on job completion)
held -> refunded (on cancellation)
held -> disputed (when dispute is opened)
disputed -> released (dispute resolved in driver's favor)
disputed -> refunded (dispute resolved in user's favor)
```

**Endpoints:**

| Endpoint | What It Does |
|---|---|
| `POST /api/completion/:id/hold-payment` | Holds payment in escrow when driver is dispatched |
| `GET /api/completion/:id/payment` | Returns payment status for a specific job |
| `GET /api/completion/payments` | Lists all payments (filter by status) |

---

## Job Completion Flow (`backend/controllers/completionController.js`)

When a job is marked complete, the system runs all steps atomically using Firestore batch writes. If any step fails, the entire operation rolls back.

**Steps:**
```
1. Check prerequisites (PIN verified? Safety check passed?)
2. Check dispute lock (active dispute = blocked)
3. Generate report (timeline, payment, safety, photos)
4. Release escrow to driver wallet
5. Soft-delete temporary files (24h grace)
6. Log audit event (JOB_FINALIZED)
7. Update job status to "completed"
```

**Endpoints:**

| Endpoint | What It Does |
|---|---|
| `POST /api/completion/:id/complete` | Runs the full finalization flow |
| `GET /api/completion/:id/report` | Returns the generated report for a completed job |
| `GET /api/completion/reports` | Lists all reports (filter by job, user, driver) |
| `POST /api/completion/archive-old` | Archives jobs older than 90 days |
| `POST /api/completion/cleanup-files` | Processes pending soft-deletions (24h grace) |
| `GET /api/completion/storage-status` | Current storage usage and pending deletion count |
| `GET /api/completion/audit-logs` | Query audit logs with filters |
| `GET /api/completion/:id/audit-trail` | Full audit trail for a specific entity |

---

## Cleanup Engine (`backend/utils/cleanupEngine.js`)

After job completion, temporary files (photos, uploads) are soft-deleted. After 24 hours, the system permanently deletes them with 3 retries and exponential backoff. If all retries fail, the failure is logged to `deletion_failures` for admin review.

**Retry schedule:**
```
Attempt 1: immediate
Attempt 2: 2 seconds delay
Attempt 3: 4 seconds delay
All fail -> log to deletion_failures collection
```

If the `deletion_failures` collection exceeds 50 unresolved entries, a `STORAGE_ALERT` is sent to admin.

---

## Audit Engine (`backend/utils/auditEngine.js`)

Every significant action in the system is logged. Each log entry contains: event type, entity ID, entity type, actor ID, actor role, details, and timestamp.

**Event types:**
```
JOB_CREATED, JOB_COMPLETED, JOB_CANCELLED, JOB_ARCHIVED, JOB_FINALIZED
PAYMENT_HELD, PAYMENT_RELEASED, PAYMENT_REFUNDED, PAYMENT_DISPUTED
REPORT_GENERATED, FILES_DELETED, FILES_SOFT_DELETED, FILE_DELETE_FAILED
DISPUTE_OPENED, DISPUTE_RESOLVED
DRIVER_SUSPENDED, DRIVER_BANNED, DRIVER_WARNING
ADMIN_ACTION, STORAGE_ALERT, SAFETY_CHECK, PANIC_TRIGGERED
```

---

## Role-Separated Dashboards (`backend/controllers/dashboardController.js`)

Each role gets a different dashboard with only their own data. No cross-contamination between roles.

**Endpoints:**

| Endpoint | What It Returns |
|---|---|
| `GET /api/dashboard/admin` | Active jobs, open incidents, fraud flags, pending disputes, admin alerts, online drivers count |
| `GET /api/dashboard/driver/:driverId` | Personal jobs, earnings, warnings, compliance status, current job status |
| `GET /api/dashboard/user/:userId` | Personal jobs, active disputes, feedback history, total spending |
| `GET /api/dashboard/garage/:garageId` | Repair requests, active quotes, completed repairs, earnings |

---

## Safety Checklists (`backend/utils/safetyEngine.js`)

Before a job can proceed, the driver must complete a service-specific safety checklist. All items must be checked before the system allows the job to move to `in_progress`.

**Tow Mount Checklist (8 items):**
```
1. Vehicle engine off and in park/neutral
2. Parking brake engaged
3. Tow straps/chains secured at designated points
4. Safety chains attached as backup
5. Tow lights connected and functional
6. Vehicle clearance checked (no dragging parts)
7. Mirrors adjusted for towed vehicle visibility
8. Hazard lights on during loading
```

**Heavy Equipment Checklist:**
```
1. Load secured to flatbed
2. Boom/arm in travel position
3. Outriggers retracted
4. Over-height route checked
5. Weight within truck capacity
```

**Garage Checklist:**
```
1. Vehicle accessible (not blocked)
2. Equipment and tools available
3. Work area clear and safe
4. Customer informed of diagnosis
```

**Industrial Checklist:**
```
1. PPE available and worn
2. Crane/lift clearance verified
3. Safety signage placed
4. Load weight confirmed
```

**Endpoints:**

| Endpoint | What It Does |
|---|---|
| `GET /api/safety/checklists` | Returns all available checklist types |
| `GET /api/safety/checklist/:serviceType` | Returns the checklist for a specific service type |
| `POST /api/safety/service-check` | Driver submits completed checklist — all items must pass |

---

## Firestore Changes

**New Security Rules** in `firestore.rules`:
- `payments` — signed-in users can read own payment status, admin can update
- `reports` — signed-in users can read own reports, admin can update
- `audit_logs` — admin only (read and write)
- `pending_deletions` — admin only
- `deletion_failures` — admin only
- `safety_checklists` — signed-in users can create, admin can update/delete

**New Indexes** in `firestore.indexes.json`:
- 11 composite indexes for dashboard queries (jobs by status + date, payments by status, reports by job, audit logs by type + time)

---

## GitHub

**Branch:** `backend-dev`
**Repo:** https://github.com/Rover-dotcom/RoadResQ
