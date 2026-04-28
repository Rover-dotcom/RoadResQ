# RoadResQ — Week 4 Backend Report
**Version:** 4.0.0 (Final) · **Deployed:** Firebase Cloud Functions · **Region:** me-central1 (Doha, Qatar)  
**Last Verified:** 2026-04-28 · Firebase deploy confirmed ✅ · GitHub committed ✅

---

## 🔗 Live Links

| Resource | URL |
|---|---|
| **API Base** | https://api-h6acdw3itq-ww.a.run.app |
| **Health Check** | https://api-h6acdw3itq-ww.a.run.app/ |
| **Firebase Console** | https://console.firebase.google.com/project/roadresq-bd6b0/overview |
| **GitHub Branch** | https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev/backend |
| **API Folder (Postman)** | https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev/api |

---

## ✅ Week 4 Goal Checklist

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

### Core Logic
| File | Path | Purpose |
|---|---|---|
| `matchingEngine.js` | `backend/utils/matchingEngine.js` | Geo-filter, capacity, height, gate pass, doc compliance, auto-assign |
| `pricingEngine.js` | `backend/utils/pricingEngine.js` | Integer halala pricing, distance tiers, peak-hour surcharge |
| `serviceEngine.js` | `backend/utils/serviceEngine.js` | `deriveJobConstraints()` — single source of truth for all constraints |
| `categoryEngine.js` | `backend/utils/categoryEngine.js` | Vehicle → service category mapping |
| `disciplineEngine.js` | `backend/utils/disciplineEngine.js` | **NEW** — no-show fee, warnings, suspension, compliance check, priority queue |

### Controllers
| File | Path | Purpose |
|---|---|---|
| `jobController.js` | `backend/controllers/jobController.js` | Job creation with logistics builder, Others support, dispatch fallback |
| `quoteController.js` | `backend/controllers/quoteController.js` | Quote flow + **NEW** multi-driver bidding system |
| `garageController.js` | `backend/controllers/garageController.js` | On-site repair broadcast → estimate bidding → customer accept |
| `driverController.js` | `backend/controllers/driverController.js` | Driver status, online/offline toggle, compliance gate |
| `disciplineController.js` | `backend/controllers/disciplineController.js` | **NEW** — all discipline endpoints + safety checklists |
| `authController.js` | `backend/controllers/authController.js` | Register/login |

### Routes
| File | Path | Endpoints |
|---|---|---|
| `jobRoutes.js` | `backend/routes/jobRoutes.js` | `/api/jobs` |
| `quoteRoutes.js` | `backend/routes/quoteRoutes.js` | `/api/quotes` + bidding |
| `garageRoutes.js` | `backend/routes/garageRoutes.js` | `/api/garage-requests` |
| `driverRoutes.js` | `backend/routes/driverRoutes.js` | `/api/drivers` |
| `disciplineRoutes.js` | `backend/routes/disciplineRoutes.js` | **NEW** `/api/discipline` |
| `authRoutes.js` | `backend/routes/authRoutes.js` | `/api/auth` |

### Entry Points
| File | Path | Purpose |
|---|---|---|
| `server.js` | `backend/server.js` | Local dev server |
| `index.js` | `functions/index.js` | Firebase Cloud Function entry |

---

## 🧠 Intelligence Engine Explained

### How `deriveJobConstraints(vehicleType)` Works

The single function in `serviceEngine.js` drives ALL matching logic:

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

If **no match found**, the API returns:
```json
{
  "dispatchStatus": "no_match",
  "dispatchMessage": "No truck with 7-ton capacity available within 10km. Please try again shortly.",
  "retryAfterMinutes": 10
}
```

---

## 💰 Pricing Calculation Walkthrough

All prices stored and computed as **integer halala** (1 QAR = 100 halala).

### Example: Sedan Tow, 12km

```
Base fare:           25000 halala  = QR 250.00
Per km (12 × 500):    6000 halala  = QR  60.00
                     ─────────────────────────────
Subtotal:            31000 halala  = QR 310.00

Peak hour (07–09, 12–13, 17–20 Qatar, +25% ETA only — price unchanged):
  Display: "QR 310.00" (ETA extended by 25%)
```

### Example: 20ft Container Quote, 30km

```
Base:                        10000 halala  = QR 100.00
Distance (30 × 500):         15000 halala  = QR 150.00
Special load surcharge (+30%):
  25000 × 1.30 =             32500 halala  = QR 325.00

Display: "QR 325.00" (but for industrial quotes, 
         garages/drivers bid their own price — this is the floor)
```

### No-Show Fee
```
Customer doesn't respond within 10 min of driver arrival:
  Fee = 5000 halala = QR 50.00
```

---

## 🔄 Complete Service Flows

### 1. Tow Job (Standard)
```
POST /api/jobs  { vehicleType: "Sedan", pickupCoords, distanceKm }
  → deriveJobConstraints("Sedan")
  → findMatchingDrivers() — 10km radius, standard_tow
  → autoAssignDriver()
  → Response: { job, driverId, estimatedETA, dispatchStatus }
```

### 2. On-Site Repair
```
POST /api/garage-requests  { issue, location }
  → broadcast to garages within 10km
  → garages submit estimates: POST /api/garage-requests/:id/estimate
  → customer views: GET /api/garage-requests/:id/estimates
  → customer accepts: PUT /api/garage-requests/:id/accept
  → mechanic dispatched, customer contact revealed
```

### 3. Industrial Quote + Bidding
```
POST /api/quotes  { vehicleType: "20ft Container", ... }
  → broadcast to garages within 15km
  → drivers/garages bid: POST /api/quotes/:id/bid  { price, etaMinutes }
  → customer views bids: GET /api/quotes/:id/bids  (sorted, best highlighted)
  → customer accepts: PUT /api/quotes/:id/bids/:bidId/accept
  → linked job auto-created, all other bids rejected
```

### 4. Driver Discipline Flow
```
Driver late → POST /api/discipline/warning/:driverId
  → warningCount++
  → if warningCount >= 3: isSuspended = true (auto)
  
Admin clears: PUT /api/discipline/clear/:driverId
  → warningCount = 0, isSuspended = false
```

### 5. Document Compliance
```
POST /api/discipline/compliance-check  (run daily by cron/scheduled task)
  → scan all drivers
  → 30 days before expiry → complianceStatus: 'expiring_soon'
  →  7 days before expiry → complianceStatus: 'expiring_critical'
  → expired              → complianceBlocked: true (cannot go online)

GET  /api/discipline/compliance/:driverId  (single driver check)
  → returns daysUntilExpiry for each document type
  → complianceBlocked, complianceWarnings[], recommended actions
```

### 6. Safety Checklists
```
Driver before starting:
POST /api/discipline/safety-check/:jobId/driver
  { hookSecured, winchLocked, safetyLightsOn, areaIsSafe,
    vehicleSecured, hazardLightsOn, properToolsUsed }
  → ALL must be true or 400 error with failedChecks list

Customer before confirming:
POST /api/discipline/safety-check/:jobId/customer
  { inSafeLocation, notStandingBehindVehicle, willVerifyIdentity }
  → ALL must be true or 400 error
```

---

## 🌐 API Endpoint Reference (Complete)

### Auth
```
POST /api/auth/register
GET  /api/auth/me/:uid
```

### Jobs
```
POST /api/jobs                          ← create job (all types)
GET  /api/jobs/my-jobs?userId=          ← customer job feed
GET  /api/jobs/:id/status               ← live tracking
GET  /api/jobs/available                ← driver job feed
GET  /api/jobs/price-estimate           ← price calculator
GET  /api/jobs/service-info             ← service catalog
PUT  /api/jobs/:id/accept               ← driver accepts
PUT  /api/jobs/:id/status               ← update status
DELETE /api/jobs/:id/cancel             ← cancel
PUT  /api/jobs/:id/rate-driver          ← customer rates
```

### Drivers
```
POST /api/drivers                       ← register
GET  /api/drivers                       ← list (filtered)
GET  /api/drivers/truck-types           ← catalog
GET  /api/drivers/:id                   ← profile
GET  /api/drivers/:id/status            ← full status + compliance
PUT  /api/drivers/:id/online            ← go online (compliance gated)
PUT  /api/drivers/:id/offline           ← go offline (job-blocked)
PUT  /api/drivers/:id/approve           ← admin approve
PUT  /api/drivers/:id                   ← update profile
```

### Quotes
```
POST /api/quotes                        ← submit quote request
GET  /api/quotes/my-quotes              ← customer quote feed
GET  /api/quotes/:id                    ← single quote
PUT  /api/quotes/:id/respond            ← garage responds (single price)
PUT  /api/quotes/:id/accept             ← customer accepts
PUT  /api/quotes/:id/reject             ← customer rejects
POST /api/quotes/:id/bid                ← multi-driver bid submission
GET  /api/quotes/:id/bids               ← view all bids (sorted)
PUT  /api/quotes/:id/bids/:bidId/accept ← accept winning bid
```

### Garage (On-Site Repair)
```
POST /api/garage-requests               ← create repair request
GET  /api/garage-requests               ← list
GET  /api/garage-requests/:id           ← single request
POST /api/garage-requests/:id/estimate  ← garage submits estimate
GET  /api/garage-requests/:id/estimates ← customer views estimates
PUT  /api/garage-requests/:id/accept    ← customer accepts estimate
PUT  /api/garage-requests/:id/status    ← update status
POST /api/garage-requests/:id/auto-cancel-check ← 15-min auto-cancel
```

### Discipline & Safety
```
POST /api/discipline/no-show                        ← apply no-show fee
POST /api/discipline/warning/:driverId              ← issue late warning
PUT  /api/discipline/clear/:driverId                ← clear suspension
POST /api/discipline/compliance-check               ← run for all drivers
GET  /api/discipline/compliance/:driverId           ← single driver check
GET  /api/discipline/priority-queue                 ← pending jobs by score
GET  /api/discipline/admin-review                   ← custom jobs for admin
PUT  /api/discipline/admin-review/:jobId/assign     ← admin manually assigns
POST /api/discipline/safety-check/:jobId/driver     ← driver pre-trip checklist
POST /api/discipline/safety-check/:jobId/customer   ← customer safety confirm
GET  /api/discipline/safety-check/:jobId            ← get both records
```

---

## 📦 Postman Collection

**File:** `api/RoadResQ_API_v4_Complete.postman_collection.json`

**GitHub:** https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev/api

**How to use:**
1. Import `RoadResQ_API_v4_Complete.postman_collection.json`
2. Import `RoadResQ_Production.postman_environment.json`
3. Set environment to **RoadResQ Production**
4. All `{{base_url}}`, `{{userId}}`, `{{driverId}}` etc. are pre-configured

---

## 🏗️ Firestore Collections Created

| Collection | Purpose |
|---|---|
| `users` | Customer profiles |
| `drivers` | Driver profiles + compliance fields |
| `jobs` | All job records |
| `quote_requests` | Quote requests + bids subcollection |
| `garage_requests` | On-site repair requests |
| `garages` | Garage profiles |
| `discipline_logs` | Warning/penalty audit trail |
| `compliance_alerts` | Per-driver document expiry alerts |
| `safety_checklists` | Driver pre-trip + customer safety records |
| `admin_review_queue` | Custom/Others jobs awaiting manual assignment |
| `garage_live_quotes` | Real-time broadcast entries for garage apps |

---

## 🔐 Security & Firestore Rules

Firestore rules enforce role-based access:

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

## 🚀 Firebase Deployment

| Item | Status |
|---|---|
| Cloud Functions v4.0.0 | ✅ Deployed (me-central1, 512MiB, 120s timeout) |
| Firestore Security Rules | ✅ Deployed |
| Firestore Indexes (16 composite) | ✅ Deployed |
| GitHub (backend-dev branch) | ✅ Committed |

**Production URL:** `https://api-h6acdw3itq-ww.a.run.app`

---

*Report generated: 2026-04-28 · RoadResQ Backend v4.0.0 (Final)*
