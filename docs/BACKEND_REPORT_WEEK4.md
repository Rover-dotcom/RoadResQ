# RoadResQ — Week 4 Backend Report
**Version:** 4.0.0 (Final) · **Deployed:** Firebase Cloud Functions · **Region:** me-central1 (Doha, Qatar)  
**Last Verified:** 2026-04-28 · Firebase deploy confirmed ✅ · GitHub committed ✅

This report documents all Week 4 backend deliverables for the RoadResQ platform — an intelligent, safety-compliant logistics system connecting customers, tow drivers, mechanics, and heavy equipment operators across Qatar.

---

## 🔗 Live Links

| Resource | URL |
|---|---|
| **API Base** | https://api-h6acdw3itq-ww.a.run.app |
| **Health Check** | https://api-h6acdw3itq-ww.a.run.app/ |
| **Firebase Console** | https://console.firebase.google.com/project/roadresq-bd6b0/overview |
| **GitHub Branch** | https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev/backend |
| **API Folder (Postman)** | https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev/api |
| **Week 4 Report (GitHub)** | https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev/docs/BACKEND_REPORT_WEEK4.md |

---

## ✅ Week 4 Goal Checklist

All 17 goals for Week 4 have been fully implemented, tested, and deployed to Firebase Cloud Functions. Each item below represents a working, production-ready feature accessible through the live API.

| Goal | Status |
|---|---|
| 4 services fully operational (Tow, Garage, Heavy, Quote) | ✅ Done |
| "Others" dynamic input across all service types | ✅ Done |
| Safety system enforced (driver pre-trip + customer confirmation) | ✅ Done |
| Smart dispatch: 10km + expertise + capacity + height | ✅ Done |
| Special Load bidding system (multi-driver bids) | ✅ Done |
| Equipment-based assignment | ✅ Done |
| Quote flow: garage only, no admin involvement | ✅ Done |
| Fallback messaging when no driver available | ✅ Done |
| Driver discipline: warnings, auto-suspend | ✅ Done |
| Document compliance: 30-day/7-day notify, expired = block | ✅ Done |
| No-show fee for customer | ✅ Done |
| Job priority queue | ✅ Done |
| Admin review queue for custom jobs | ✅ Done |
| All pricing in QAR halala integers | ✅ Done |
| Postman collection updated | ✅ Done |
| Firebase deployed | ✅ Done |
| GitHub committed | ✅ Done |

---

## 📂 Source File Map

This section maps every backend file to its role. Files marked **NEW** were created in Week 4; all others were significantly extended from earlier versions.

### Core Logic (Utils)

These utility files contain the business logic that the controllers call. They are the "brain" of the platform — no UI or HTTP layer here, just pure logic functions.

| File | Path | Purpose |
|---|---|---|
| `matchingEngine.js` | `backend/utils/matchingEngine.js` | Geo-filter, capacity, height, gate pass, doc compliance, auto-assign |
| `pricingEngine.js` | `backend/utils/pricingEngine.js` | Integer halala pricing, distance tiers, peak-hour ETA buffer |
| `serviceEngine.js` | `backend/utils/serviceEngine.js` | `deriveJobConstraints()` — single source of truth for all vehicle/truck constraints |
| `categoryEngine.js` | `backend/utils/categoryEngine.js` | Maps vehicle type strings to their correct service category |
| `disciplineEngine.js` | `backend/utils/disciplineEngine.js` | **NEW** — no-show fee, 3-strike warnings, auto-suspension, compliance checking, priority queue |

### Controllers

Controllers handle incoming HTTP requests, validate input, call the utility/model layer, and return structured JSON responses.

| File | Path | Purpose |
|---|---|---|
| `jobController.js` | `backend/controllers/jobController.js` | Job creation with full logistics builder, "Others" support, and dispatch fallback messages |
| `quoteController.js` | `backend/controllers/quoteController.js` | Quote flow with **NEW** multi-driver bidding system and auto-job creation on acceptance |
| `garageController.js` | `backend/controllers/garageController.js` | **NEW** — on-site repair broadcast → estimate bidding → customer first-accept-wins |
| `driverController.js` | `backend/controllers/driverController.js` | Driver status management, online/offline toggle with compliance gating |
| `disciplineController.js` | `backend/controllers/disciplineController.js` | **NEW** — all discipline endpoints including safety checklists and admin review queue |
| `authController.js` | `backend/controllers/authController.js` | Register and login for all user roles |

### Routes

Route files define the HTTP method and path for each endpoint, then delegate to the appropriate controller function.

| File | Path | Endpoints |
|---|---|---|
| `jobRoutes.js` | `backend/routes/jobRoutes.js` | `/api/jobs` — 10 endpoints |
| `quoteRoutes.js` | `backend/routes/quoteRoutes.js` | `/api/quotes` — 8 endpoints including bidding |
| `garageRoutes.js` | `backend/routes/garageRoutes.js` | `/api/garage-requests` — 8 endpoints |
| `driverRoutes.js` | `backend/routes/driverRoutes.js` | `/api/drivers` — 9 endpoints |
| `disciplineRoutes.js` | `backend/routes/disciplineRoutes.js` | **NEW** `/api/discipline` — 11 endpoints |
| `authRoutes.js` | `backend/routes/authRoutes.js` | `/api/auth` — 2 endpoints |

### Entry Points

| File | Path | Purpose |
|---|---|---|
| `server.js` | `backend/server.js` | Local Express server — run with `node server.js` for development |
| `index.js` | `functions/index.js` | Firebase Cloud Function entry — exports the same Express app to production |

---

## 🧠 Intelligence Engine Explained

### How `deriveJobConstraints(vehicleType)` Works

This is the core of the intelligent dispatch system. Instead of requiring the customer to know what type of truck or equipment is needed, the system automatically derives all matching constraints from just the `vehicleType` field — the customer only selects their vehicle, and the backend handles the rest.

```
vehicleType = "JCB 3CX Backhoe"
     ↓
deriveJobConstraints()
     ↓
{
  requiredTruckType: 'flatbed_heavy',
  requiredEquipmentTypes: ['flatbed'],
  minCapacityKg: 7000,
  isSpecialLoad: true,           ← triggers expert routing
  requiresMinExperienceYears: 2
}
     ↓
matchingEngine filters:
  1. isOnline + isAvailable + isApproved
  2. NOT complianceBlocked (expired docs)
  3. NOT isSuspended
  4. truckType === 'flatbed_heavy'
  5. maxCapacityKg >= 7000
  6. equipmentTypes includes 'flatbed'
  7. yearsExperience >= 2
  8. within 10km (haversine)
     ↓
Sort: experience DESC → rating DESC → distance ASC
     ↓
Auto-assign drivers[0]
```

### Fallback When No Driver Is Found

If no driver passes all filters (e.g., no truck with 7-ton capacity within 10km), the API does not silently fail — it returns a detailed explanation to the customer with what is required and what to do next.

```json
{
  "dispatchStatus": {
    "dispatched": false,
    "message": "No driver is currently available for a JCB in your area. Your job has been queued.",
    "whatIsNeeded": {
      "truckType": "flatbed_heavy",
      "equipmentTypes": ["flatbed"],
      "isSpecialLoad": true
    },
    "nextSteps": "We will notify you as soon as a driver accepts your job."
  }
}
```

---

## 💰 Pricing Calculation Walkthrough

All prices are stored and computed as **integer halala** (the smallest unit of QAR, where 100 halala = 1 QAR). This approach eliminates floating-point rounding errors that would occur with decimal arithmetic in financial calculations.

**Helpers:**
- `toQRDisplay(31000)` → `"QR 310.00"` — converts halala to human-readable display
- `toHalala(310.00)` → `31000` — converts QAR input to integer storage format

### Example: Sedan Tow, 12km

The pricing engine looks up the vehicle's base fare and per-km rate from the pricing table, multiplies by the job distance, and returns the total in halala alongside a display string.

```
Base fare:           25000 halala  = QR 250.00
Per km (12 × 500):    6000 halala  = QR  60.00
                     ─────────────────────────────
Total:               31000 halala  = QR 310.00

Display: "QR 310.00"
Peak hour (07–09, 12–13, 17–20 Qatar): price is unchanged, but ETA is extended +25%
```

### Example: 20ft Container Quote, 30km

Industrial and heavy equipment jobs cannot be automatically priced due to their complexity. The system uses a calculated floor price as a reference, but garages/drivers submit their own competitive bids for the customer to choose from.

```
Base:                        10000 halala  = QR 100.00
Distance (30 × 500):         15000 halala  = QR 150.00
Special load surcharge (+30%):
  25000 × 1.30 =             32500 halala  = QR 325.00

Note: For industrial quotes, garages bid their own price — QR 325.00 is the minimum floor.
```

### No-Show Fee

If a customer does not respond within 10 minutes after a driver arrives at the pickup location, a QR 50.00 no-show wait fee is automatically applied to their account and logged in the discipline collection.

```
Fee = 5000 halala = QR 50.00
Trigger: customer has not confirmed within 10 minutes of driver arrival
```

---

## 🔄 Complete Service Flows

Each flow below represents an end-to-end journey from customer request to job completion, showing which API calls are made at each step and what the system does internally.

### 1. Standard Tow Job

The customer submits their vehicle type and location. The system automatically determines the correct truck type, calculates the price, finds the nearest qualified driver within 10km, and assigns them — all within a single API call.

```
POST /api/jobs  { vehicleType: "Sedan", pickupCoords, distanceKm }
  → deriveJobConstraints("Sedan")           — figures out: standard_tow, 2500kg cap
  → findMatchingDrivers()                   — 9-filter check, 10km radius
  → autoAssignDriver()                      — assigns closest qualified driver
  → Response: { job, driverId, estimatedETA, dispatchStatus }
```

### 2. On-Site Repair (Garage Comes to You)

Instead of going to a garage, the customer requests a mechanic to come to their location. The request is broadcast to all garages within 10km, each can submit a price estimate, and the customer picks the one they prefer. If no garage responds within 15 minutes, the request is auto-cancelled.

```
POST /api/garage-requests  { issue, location }
  → broadcast to garages within 10km         — written to garage_live_requests
  → garages submit estimates: POST /api/garage-requests/:id/estimate
  → customer views: GET /api/garage-requests/:id/estimates  (sorted cheapest first)
  → customer accepts: PUT /api/garage-requests/:id/accept   (first-accept-wins)
  → mechanic dispatched, customer contact info revealed to garage
  → auto-cancel check: POST /api/garage-requests/:id/auto-cancel-check (15 min)
```

### 3. Industrial Quote + Multi-Driver Bidding

For complex loads (precast, containers, heavy machinery), the system broadcasts the job to multiple garages and drivers who then compete by submitting price bids. The customer sees all bids sorted by price with the best one highlighted, then selects their preferred provider. Accepting a bid auto-creates a linked job and auto-rejects all other bids.

```
POST /api/quotes  { vehicleType: "20ft Container", pickupCoords, ... }
  → broadcast to garages within 15km
  → drivers/garages bid: POST /api/quotes/:id/bid  { price, etaMinutes }
  → customer views bids: GET /api/quotes/:id/bids  (sorted by price, best flagged)
  → customer accepts: PUT /api/quotes/:id/bids/:bidId/accept
  → linked job auto-created in 'jobs' collection, all other bids auto-rejected
```

### 4. Driver Discipline (3-Strike System)

When a driver is late or fails to appear for a job, a warning is issued to their profile. After 3 warnings, the account is automatically suspended and the driver cannot go online or accept any jobs until an admin manually clears the suspension.

```
Driver late → POST /api/discipline/warning/:driverId
  → warnings++ on driver profile
  → if warnings >= 3: isSuspended = true, isOnline = false, isAvailable = false

Admin clears: PUT /api/discipline/clear/:driverId
  → warnings = 0, isSuspended = false, driver can log back in
```

### 5. Document Compliance Enforcement

The compliance system scans all driver documents (license, insurance, visa, roadworthiness certificate) daily. Drivers approaching expiry receive staged alerts, and any driver with an expired document is automatically blocked from going online until the document is renewed and cleared by admin.

```
POST /api/discipline/compliance-check  (run daily by cron/scheduled task)
  → scan all drivers in Firestore
  → 30 days before expiry → complianceStatus: 'expiring_soon'   (notification sent)
  →  7 days before expiry → complianceStatus: 'expiring_critical' (daily reminder)
  → expired              → complianceBlocked: true (driver cannot go online)

GET  /api/discipline/compliance/:driverId  (single driver check anytime)
  → returns daysUntilExpiry for each document type
  → complianceBlocked flag, complianceWarnings[], and recommended actions
```

### 6. Pre-Trip Safety Checklists

Before a driver can start a job, they must submit a 6-item safety checklist through the API — this acts as a gate that prevents the job from progressing to `in_progress` status. Similarly, the customer must confirm 3 safety items before the job is confirmed on their side. If any item fails, the API returns a 400 error listing which checks failed.

```
Driver before starting:
POST /api/discipline/safety-check/:jobId/driver
  { hookSecured, winchLocked, safetyLightsOn, areaIsSafe,
    vehicleSecured, hazardLightsOn, properToolsUsed }
  → ALL must be true or 400 error with failedChecks[] list

Customer before confirming:
POST /api/discipline/safety-check/:jobId/customer
  { inSafeLocation, notStandingBehindVehicle, willVerifyIdentity }
  → ALL must be true or 400 error
```

---

## 🌐 API Endpoint Reference (Complete)

The RoadResQ API has 46 total endpoints across 6 route groups. All endpoints follow a consistent JSON response format: `{ status: "success" | "error", data: {} }`.

### Auth
These endpoints handle user registration and profile lookup for all roles (customer, driver, admin).

```
POST /api/auth/register        ← create account (role: customer | driver | admin)
GET  /api/auth/me/:uid         ← get profile by Firebase UID
```

### Jobs
The core job lifecycle — from creation to completion. The `POST /api/jobs` endpoint automatically derives constraints, calculates pricing, and attempts driver auto-assignment in a single request.

```
POST   /api/jobs                        ← create job (all service types)
GET    /api/jobs/my-jobs?userId=        ← customer's job history with status messages
GET    /api/jobs/:id/status             ← live job status + driver ETA + location
GET    /api/jobs/:id/match              ← list matching drivers for a job (admin view)
GET    /api/jobs/available              ← pending jobs a driver can pick up (driver feed)
GET    /api/jobs/price-estimate         ← calculate price before booking
GET    /api/jobs/service-info           ← full service catalog + vehicle types + pricing table
PUT    /api/jobs/:id/accept             ← driver manually self-accepts a pending job
PUT    /api/jobs/:id/status             ← update job lifecycle status
DELETE /api/jobs/:id/cancel             ← cancel a job (releases assigned driver)
PUT    /api/jobs/:id/rate-driver        ← customer submits 1–5 star rating after completion
```

### Drivers
Driver management from registration to operational status. The `online` endpoint is compliance-gated — suspended or document-expired drivers are blocked from going online.

```
POST /api/drivers                       ← register driver profile (after auth register)
GET  /api/drivers                       ← list all drivers (filter: truckType, isOnline)
GET  /api/drivers/truck-types           ← catalog of truck types for registration form
GET  /api/drivers/:id                   ← full driver profile
GET  /api/drivers/:id/status            ← live status: online, compliance, active job
PUT  /api/drivers/:id/online            ← go online — blocked if suspended/docs expired
PUT  /api/drivers/:id/offline           ← go offline — blocked if active job in progress
PUT  /api/drivers/:id/approve           ← admin approves or revokes a driver
PUT  /api/drivers/:id                   ← update driver profile fields
```

### Quotes
The quote system handles non-standard jobs that require custom pricing. Admin is not involved in any quote responses — garages and drivers handle everything directly.

```
POST /api/quotes                        ← customer submits quote request (auto-broadcasts to garages)
GET  /api/quotes/my-quotes              ← customer's quote history + status
GET  /api/quotes/:id                    ← full quote detail
PUT  /api/quotes/:id/respond            ← garage submits a single quoted price
PUT  /api/quotes/:id/accept             ← customer accepts a quote (auto-creates job)
PUT  /api/quotes/:id/reject             ← customer rejects a quote
POST /api/quotes/:id/bid                ← garage/driver submits a competitive bid (price + ETA)
GET  /api/quotes/:id/bids               ← customer views all bids (sorted by price, best flagged)
PUT  /api/quotes/:id/bids/:bidId/accept ← customer accepts winning bid (auto-rejects others)
```

### Garage (On-Site Repair)
This is a new service type added in Week 4 where mechanics come to the customer's location instead of the customer going to a garage. Requests are broadcast to multiple garages competitively.

```
POST /api/garage-requests                        ← customer creates repair request
GET  /api/garage-requests                        ← list requests (admin/garage view)
GET  /api/garage-requests/:id                    ← single request detail
POST /api/garage-requests/:id/estimate           ← garage submits a price estimate
GET  /api/garage-requests/:id/estimates          ← customer views all estimates (cheapest first)
PUT  /api/garage-requests/:id/accept             ← customer accepts an estimate (first-accept-wins)
PUT  /api/garage-requests/:id/status             ← update repair status (on_the_way, in_progress, done)
POST /api/garage-requests/:id/auto-cancel-check  ← triggered after 15min if no garage responded
```

### Discipline & Safety
These endpoints manage driver accountability, document compliance, safety protocols, and job priority. The system is fully automated — penalties and compliance blocking happen without manual intervention.

```
POST /api/discipline/no-show                        ← charge customer QR 50 no-show fee
POST /api/discipline/warning/:driverId              ← issue late/no-show warning to driver
PUT  /api/discipline/clear/:driverId                ← admin clears driver suspension
POST /api/discipline/compliance-check               ← run document expiry scan for all drivers
GET  /api/discipline/compliance/:driverId           ← get compliance status for one driver
GET  /api/discipline/priority-queue                 ← pending jobs ranked by urgency score
GET  /api/discipline/admin-review                   ← "Others" / custom jobs needing manual review
PUT  /api/discipline/admin-review/:jobId/assign     ← admin manually assigns a custom job
POST /api/discipline/safety-check/:jobId/driver     ← driver submits pre-trip safety checklist
POST /api/discipline/safety-check/:jobId/customer   ← customer confirms safety items
GET  /api/discipline/safety-check/:jobId            ← retrieve both checklist records for a job
```

---

## 📦 Postman Collection

The Postman collection contains all 46 endpoints with pre-filled request bodies, query parameters, and environment variables — ready to test the production API immediately after import.

**File:** `docs/RoadResQ_API_v4_Complete.postman_collection.json`  
**GitHub:** https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev/docs

**How to use:**
1. Import `RoadResQ_API_v4_Complete.postman_collection.json`
2. Import `RoadResQ_Production.postman_environment.json`
3. Set the active environment to **RoadResQ Production**
4. All `{{base_url}}`, `{{userId}}`, `{{driverId}}`, `{{jobId}}` variables are pre-configured

---

## 🏗️ Firestore Collections

Firestore serves as the primary database. Each collection is purpose-built for a specific domain and has corresponding composite indexes deployed for efficient querying.

| Collection | Purpose | Notes |
|---|---|---|
| `users` | Customer profiles (name, phone, address) | Linked to Firebase Auth UID |
| `drivers` | Driver profiles, truck specs, compliance fields | 20+ fields including Week 4 additions |
| `jobs` | All job records across all service types | 30+ fields; unified schema |
| `quote_requests` | Quote requests with bids sub-collection | Admin read-only |
| `garage_requests` | On-site repair requests | New in Week 4 |
| `garages` | Garage profiles and location for broadcasting | Queried by geo-radius |
| `discipline_logs` | Warning and penalty audit trail | Immutable log records |
| `compliance_alerts` | Per-driver document expiry notifications | Written by daily compliance check |
| `safety_checklists` | Driver pre-trip + customer safety records | Gated before job start |
| `admin_review_queue` | Custom/Others jobs awaiting manual assignment | Written when vehicleType = "Others" |
| `garage_live_quotes` | Real-time broadcast entries for garage-side apps | One doc per garage per broadcast |

---

## 🔐 Security & Firestore Rules

Firestore security rules enforce role-based access at the database level — the API never relies solely on application-level checks. Each collection restricts reads and writes to only the parties that legitimately need access.

| Collection | Read | Write |
|---|---|---|
| `users` | Owner only | Owner only |
| `drivers` | Admin + self | Self (profile update) |
| `jobs` | Owner + assigned driver | System only |
| `quote_requests` | Owner + nearby garages | Garage (respond), owner (accept) |
| `garage_requests` | Owner + nearby garages | Garage (estimate), owner (accept) |
| `discipline_logs` | Admin only | System only |
| `safety_checklists` | Owner + assigned driver | Owner + driver |

---

## 🚀 Firebase Deployment Status

The entire backend runs as a single Firebase Cloud Function (2nd Gen) in the `me-central1` region, which is the closest Google Cloud region to Qatar. The function exports the Express app and handles all routing internally.

| Item | Status | Detail |
|---|---|---|
| Cloud Functions v4.0.0 | ✅ Deployed | me-central1, 512MiB RAM, 120s timeout |
| Firestore Security Rules | ✅ Deployed | 7 collection rules, role-based |
| Firestore Indexes | ✅ Deployed | 16 composite indexes for all queries |
| GitHub (backend-dev branch) | ✅ Committed | All source code in `/backend` + `/functions` |

**Production API URL:** `https://api-h6acdw3itq-ww.a.run.app`  
**Firebase Console:** `https://console.firebase.google.com/project/roadresq-bd6b0/overview`

---

*Report generated: 2026-04-28 · RoadResQ Backend v4.0.0 (Final)*
