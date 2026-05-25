# RoadResQ — Backend Report: Week 7
## Security + Performance + Production Readiness
**Version:** v9.0.0  
**Date:** May 25, 2026

---

## Changes Made

### 1. Authentication Hardening — Route-Level RBAC Enforcement

- Added `verifyToken` + `requireRole()` to **all 20 route files** (100% coverage)
- Previously only 2/20 route files had auth; 14 were completely open
- Admin-only routes (fraud, backup, discipline, dashboard/admin) enforce `requireRole('admin')`
- Driver-only routes (accept job, go online/offline, request payout) enforce `requireRole('driver')`
- Garage-only routes (respond to quotes, submit estimates) enforce `requireRole('garage', 'admin')`
- Created reusable RBAC middleware module with pre-built role guards: `requireAuth`, `requireAdmin`, `requireDriver`, `requireGarage`, `requireOwnerOrAdmin()`

**Files:**
- `backend/middleware/rbac.js` — [NEW] Pre-built RBAC middleware arrays
- `backend/routes/jobRoutes.js` — Added verifyToken to 11 routes, requireRole to accept/available
- `backend/routes/driverRoutes.js` — Added verifyToken to 8 routes
- `backend/routes/quoteRoutes.js` — Added verifyToken+requireRole('garage') to respond/bid routes
- `backend/routes/garageRoutes.js` — Added verifyToken+requireRole('garage') to estimate routes
- `backend/routes/walletRoutes.js` — Added verifyToken to all, requireRole('admin') to /all
- `backend/routes/payoutRoutes.js` — Added requireRole('driver') to request, requireRole('admin') to approve/reject
- `backend/routes/dispatchRoutes.js` — Added requireRole('driver') to accept/decline
- `backend/routes/mapsRoutes.js` — Added requireRole('admin') to clear-cache
- `backend/routes/fraudRoutes.js` — All 5 routes locked to admin only
- `backend/routes/disciplineRoutes.js` — Admin-only for enforcement, verifyToken for reads
- `backend/routes/incidentRoutes.js` — Admin-only for live/analytics/alerts
- `backend/routes/disputeRoutes.js` — Admin-only for resolve, verifyToken for reads
- `backend/routes/dashboardRoutes.js` — Admin-only for admin dashboard, verifyToken for user/driver/garage
- `backend/routes/completionRoutes.js` — Admin-only for reports/payments/archive/cleanup/audit
- `backend/routes/safetyRoutes.js` — verifyToken on all mutation routes

---

### 2. Rate Limiting — express-rate-limit

- Replaced broken in-memory rate limiter with `express-rate-limit`
- Three tiers:
  - **General API:** 100 requests/minute per IP
  - **Auth endpoints:** 10 requests/minute (prevents OTP/login spam)
  - **Job creation:** 5 requests/minute (prevents fake booking attacks)
- Returns standardized error response with `429 Too Many Requests`

**File:** `backend/server.js` — Lines 63–94

---

### 3. Security Headers — Helmet

- Added `helmet` middleware for automatic security headers
- Protects against XSS, clickjacking, MIME sniffing, and other common web attacks
- `contentSecurityPolicy` disabled for API-only server (no HTML served)

**File:** `backend/server.js` — Line 44

---

### 4. Response Compression — Gzip

- Added `compression` middleware for automatic gzip compression
- Reduces payload size by 60-80% for JSON responses
- Especially impactful for large responses (driver lists, transaction history)

**File:** `backend/server.js` — Line 45

---

### 5. Centralized Error Handling

- Created custom error classes: `AppError`, `ValidationError`, `NotFoundError`, `AuthError`, `ForbiddenError`, `PaymentError`, `RateLimitError`
- `catchAsync` wrapper eliminates try/catch boilerplate in controllers
- `validateRequest` middleware for express-validator integration
- `globalErrorHandler` is the last middleware — catches all unhandled errors with structured JSON responses
- Stack traces only shown in development mode

**File:** `backend/middleware/errorHandler.js` — [NEW]

---

### 6. Structured Logging — Winston

- Replaced `console.log` with Winston structured JSON logger
- Domain-specific log helpers: `logger.payment()`, `logger.fraud()`, `logger.auth()`, `logger.admin()`, `logger.driver()`, `logger.notification()`
- HTTP request logger middleware logs method, path, status, duration, and request ID
- Color-formatted output in development, JSON in production

**File:** `backend/utils/logger.js` — [NEW]

---

### 7. Standardized API Responses

- Created `responseHelper.js` with `success()`, `created()`, `error()`, `paginated()` helpers
- All responses include `success` boolean, `status`, `message`, `requestId`
- Paginated responses include `meta` with page, limit, total, totalPages, hasMore

**File:** `backend/utils/responseHelper.js` — [NEW]

---

### 8. Push Notification Engine (FCM)

- Full Firebase Cloud Messaging integration
- FCM token registration with per-user token management (max 5 tokens, auto-cleanup invalid tokens)
- In-app notification storage in Firestore `notifications` collection
- Convenience helpers for all notification types: `notifyJobAssigned`, `notifyDriverArriving`, `notifyDriverArrived`, `notifyJobCompleted`, `notifyPaymentReceived`, `notifyPayoutApproved`, `notifyDisputeResolved`, `notifyPanicAlert`, `notifyQuoteReceived`
- Batch send to multiple users with `sendToMultiple()`
- Mark as read, mark all read, get unread count

**Files:**
- `backend/utils/notificationEngine.js` — [NEW] 11 notification types, FCM + in-app
- `backend/controllers/notificationController.js` — [NEW] 6 endpoints
- `backend/routes/notificationRoutes.js` — [NEW] POST /token, GET /, GET /unread-count, PUT /read-all, PUT /:id/read, POST /send

---

### 9. Firebase Storage Engine

- Organized bucket paths: drivers/, jobs/, disputes/, gate_passes/, vehicles/, backups/
- File validation: type (JPEG/PNG/WebP/PDF) and size (max 10MB)
- Signed URL generation for secure downloads (15-minute expiry)
- Signed upload URLs for direct client-to-Storage uploads
- Delete by file path or by download URL (auto-parses Firebase Storage URLs)

**File:** `backend/utils/storageEngine.js` — [NEW]

---

### 10. Firestore Backup System

- Admin-triggered backup of 12 critical collections: jobs, users, drivers, payments, wallets, wallet_transactions, audit_logs, disputes, fraud_flags, payouts, incidents, reports
- Each collection exported as JSON to Cloud Storage under `backups/{date}/{collection}.json`
- Backup logs stored in Firestore `backup_logs` collection with summary stats
- Backup history retrieval and latest backup query

**Files:**
- `backend/utils/backupEngine.js` — [NEW]
- `backend/routes/adminRoutes.js` — [NEW] POST /backup, GET /backup/history, GET /backup/latest, GET /system-info

---

### 11. Wallet Idempotency + Amount Limits

- Added `Idempotency-Key` header support on deposit and withdraw operations
- Duplicate requests with same idempotency key return cached result instead of executing twice
- Idempotency keys stored in Firestore `idempotency_keys` collection with 24-hour TTL
- Amount limits: max deposit QR 10,000 (1,000,000 fils), max withdrawal QR 5,000 (500,000 fils)

**File:** `backend/utils/walletEngine.js` — Modified (checkIdempotency, saveIdempotencyKey, MAX_DEPOSIT, MAX_WITHDRAWAL)

---

### 12. Fraud Engine Upgrades

- **Velocity check:** Detects 3+ bookings in 1 hour → flagged as suspicious
- **Suspicious payout detection:** New drivers (<7 days) requesting large payouts flagged
- **Excessive cancellations:** 5+ cancellations in 24 hours → auto-blocks user for 24 hours
- **Duplicate account detection:** Scans for shared phone or email across accounts
- **Auto fraud check:** Combined function that runs velocity + scoring + auto-flagging on job create/complete

**File:** `backend/utils/fraudEngine.js` — Modified (5 new functions added)

---

### 13. Saved Locations System

- Full CRUD for customer saved locations (Home, Work, etc.)
- Ownership verification: users can only modify their own locations
- Stored in Firestore `saved_locations` collection

**Files:**
- `backend/controllers/savedLocationController.js` — [NEW]
- `backend/routes/savedLocationRoutes.js` — [NEW] POST /, GET /, PUT /:id, DELETE /:id

---

### 14. Server Infrastructure Upgrade

- Version bumped to v9.0.0
- 22 route modules mounted (up from 18)
- Health check response includes security info (auth, RBAC, rate limiting, helmet, idempotency)
- Global error handler replaced inline error handler with centralized `globalErrorHandler`

**File:** `backend/server.js` — Modified

---

### 15. Postman Collection

- New Week 7 collection with 16 requests covering all new endpoints
- Includes notifications, saved locations, admin backup, fraud upgrades, wallet idempotency, rate limit testing

**File:** `backend/postman/RoadResQ_Week7_v9.postman_collection.json` — [NEW]

---

## New Firestore Collections (Week 7)

| Collection | Purpose |
|---|---|
| `notifications` | In-app notifications (push + stored) |
| `saved_locations` | Customer saved addresses |
| `backup_logs` | Backup execution history |
| `idempotency_keys` | Payment deduplication (24h TTL) |

---

## New Dependencies

| Package | Purpose |
|---|---|
| `helmet` | Security headers (XSS, CSRF, clickjacking) |
| `compression` | Gzip response compression |
| `express-rate-limit` | Request rate limiting |
| `winston` | Structured JSON logging |

---

## Security Summary

| Area | Before (Week 6) | After (Week 7) |
|---|---|---|
| Routes with auth | 6/20 (30%) | 20/20 (100%) |
| Admin routes locked | 2 | 14 |
| Rate limiting | Broken (in-memory, serverless) | express-rate-limit (3 tiers) |
| Security headers | None | Helmet (XSS, clickjacking, MIME) |
| Payment idempotency | None | Idempotency-Key with 24h TTL |
| Error handling | Inline per-route | Centralized globalErrorHandler |
| Logging | console.log | Winston structured JSON |
| Fraud detection | Score-based only | +Velocity, +Cancellation blocks, +Duplicate detection |
