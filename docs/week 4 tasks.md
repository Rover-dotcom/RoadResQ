# RoadResQ — Week 4 Backend Report
### Advanced System: Intelligence + Safety + Logistics
**Date:** April 26, 2026  
**Version:** v3.0.0 (upgraded from v2.0.0)  
**Deployed to:** `https://api-h6acdw3itq-ww.a.run.app` (Firebase Cloud Functions, me-central1 Doha, Qatar)  
**Firebase Project:** `roadresq-bd6b0`

---

## Executive Summary

Week 4 transforms RoadResQ from a basic dispatch system into a **constraint-aware, intelligence-driven logistics platform**. The backend now handles advanced geo-spatial matching, driver discipline enforcement, on-site garage repair bidding, and a precise integer-based pricing model. All 4 services (Tow, Garage, Heavy, Quote) are fully operational with the new "Others" dynamic input system.

---

## 1. Week 4 Checklist — Final Status

| Week 4 Goal | Status | File |
|---|---|---|
| 4 services fully operational (Tow, Garage, Heavy, Quote) | DONE | serviceEngine.js |
| "Others" dynamic input across all services | DONE | jobModel.js, jobController.js |
| Safety system enforced (driver + customer) | DONE | disciplineEngine.js |
| Smart dispatch (10km + expertise + capacity + height) | DONE | matchingEngine.js |
| Special Load bidding system (structured + real-world) | DONE | garageController.js |
| Equipment-based assignment (lifting / hauling / towing) | DONE | matchingEngine.js, driverModel.js |
| Basement / restricted access filtering | DONE | matchingEngine.js, jobModel.js |
| Multilingual driver system (RTL ready, Firestore fields) | DONE | driverModel.js |
| Advanced pricing (halala integer model) | DONE | pricingEngine.js |
| Document compliance + discipline system | DONE | disciplineEngine.js |
| Firestore rules updated for new collections | DONE | firestore.rules |
| Firestore indexes deployed for new queries | DONE | firestore.indexes.json |
| Firebase Cloud Functions deployed (v3.0.0) | DONE | functions/index.js |

---

## 2. New Files Created

| File | Purpose |
|---|---|
| backend/utils/disciplineEngine.js | Driver no-show, warnings, suspension, compliance |
| backend/controllers/garageController.js | On-site repair bidding system |
| backend/routes/garageRoutes.js | REST routes for garage repair flow |
| backend/routes/disciplineRoutes.js | Admin/system discipline endpoints |

---

## 3. Modified Files

| File | What Changed |
|---|---|
| backend/utils/matchingEngine.js | Full Week 4 rebuild: geo-radius, height filter, equipment, gate-pass, compliance check, expert priority |
| backend/utils/pricingEngine.js | Integer halala pricing, onsite_repair entry, noshow_penalty, toQRDisplay() / toHalala() helpers |
| backend/models/driverModel.js | +vehicleHeightMm, equipmentTypes[], yearsExperience, hasGatePass, isExpert, discipline counters, 4 doc expiry fields, complianceBlocked |
| backend/models/jobModel.js | +customItem/customDetails (Others), logistics builder, isRestrictedArea, clearanceHeightMm, requiresGatePass, equipmentType, isSpecialLoad, priceDisplay, estimatedETA |
| backend/controllers/jobController.js | Passes all Week 4 constraints to matching engine (geo + equipment + height + gate-pass) |
| backend/server.js | Registered garageRoutes + disciplineRoutes, v3.0.0 health check |
| functions/index.js | Updated to v3.0.0, added both new routes, increased memory to 512MiB, timeout to 120s |
| firestore.rules | Added garage_requests, garage_live_requests, driver_discipline_log, notifications collections |
| firestore.indexes.json | Full composite indexes for all new + existing queries |

---

## 4. Feature Deep Dive

### 4.1 Intelligent Matching Engine — 10 Filters

**File:** backend/utils/matchingEngine.js

```
Query (Firestore): isOnline=true + isApproved=true + isAvailable=true
  |
  ▼ In-memory filters:
  1. Document compliance (licenseExpiry, insuranceExpiry, isSuspended)
  2. Truck type compatibility (upgrade-path aware)
  3. Max capacity (kg) >= job requirement
  4. Geo radius — haversine distance <= 10km from pickup
  5. Vehicle height <= site clearance (basement filter)
  6. Gate pass (driver.hasGatePass must be true)
  7. Equipment type (boom_truck / flatbed / flatbed_tow match)
  8. Special load routing (yearsExperience >= 2 OR isExpert = true)
  9. Service type support
```

**Sort Priority (Expert-first routing):**
1. yearsExperience DESC  — most experienced driver first
2. rating DESC           — higher rated next
3. distanceKm ASC        — closest if tied

**ETA Calculation with Peak Hour Buffer:**

| Time | Speed | Buffer |
|---|---|---|
| Off-peak | 40 km/h | None |
| Peak (07:00-09:00, 12:00-13:00, 17:00-20:00 Qatar) | 32 km/h | +25% travel time |

Example: Driver 5km away during peak hour
→ ETA = ceil(5 / 32 × 60) = ceil(9.375) = 10 minutes

---

### 4.2 Integer Halala Pricing Model

**File:** backend/utils/pricingEngine.js

All prices stored as integers in halala (1/100th of a QAR).

```
5000 halala = QR 50.00
toQRDisplay(5000)  → "QR 50.00"
toHalala(50.00)    → 5000
```

**Pricing Table:**

| Service | Vehicle | Base Fare | Per Km |
|---|---|---|---|
| Tow | Motorcycle | QR 150.00 (15000 hl) | QR 3.00 |
| Tow | Sedan | QR 250.00 (25000 hl) | QR 5.00 |
| Tow | SUV | QR 300.00 (30000 hl) | QR 6.00 |
| Tow | 4x4 | QR 380.00 (38000 hl) | QR 8.00 |
| Heavy | Skid Loader | QR 800.00 (80000 hl) | QR 12.00 |
| Heavy | JCB | QR 1,500.00 (150000 hl) | QR 18.00 |
| Heavy | Excavator | QR 2,000.00 (200000 hl) | QR 22.00 |
| Garage | Urgent | QR 300.00 (30000 hl) | QR 5.00 |
| Penalty | No-Show | QR 50.00 (5000 hl) | — |

**Price Calculation Example — Sedan tow, 8km:**
```
Base fare:       25000 hl  (QR 250.00)
Distance charge:  4000 hl  (500 hl/km × 8km)
─────────────────────────────────────────────
Total:           29000 hl  (QR 290.00)
```

---

### 4.3 On-Site Garage Repair Bidding System

**Files:** backend/controllers/garageController.js, backend/routes/garageRoutes.js

**Status Flow:**
```
pending
  → collecting_estimates  (after broadcast to garages in 10km)
  → accepted              (user accepts a bid — FIRST ACCEPT WINS)
  → on_the_way
  → in_progress
  → completed
  OR
  → cancelled             (auto-cancel if no garage responds in 15 minutes)
```

**API Endpoints:**

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/garage-requests | Customer creates repair request |
| GET | /api/garage-requests | List requests |
| GET | /api/garage-requests/:id | Get single request |
| POST | /api/garage-requests/:id/estimate | Garage submits price bid |
| GET | /api/garage-requests/:id/estimates | View all bids (cheapest first) |
| PUT | /api/garage-requests/:id/accept | User accepts a bid |
| PUT | /api/garage-requests/:id/status | Update status |
| POST | /api/garage-requests/:id/auto-cancel | Trigger 15min auto-cancel check |

---

### 4.4 Driver Discipline — 3-Strike Model

**File:** backend/utils/disciplineEngine.js

```
Driver late          → warnings + 1
Driver no-show       → warnings + 1 + job re-opened for reassignment
warnings >= 3        → isSuspended = true, isAvailable = false, isOnline = false

Customer no-show     → charge QR 50.00 (5000 halala) + job cancelled

Admin unsuspend      → warnings = 0, isSuspended = false
```

---

### 4.5 Document Compliance Enforcement

| Field | At 30 days | At 7 days | If Expired |
|---|---|---|---|
| licenseExpiry | Notify | Notify daily | complianceBlocked = true |
| insuranceExpiry | Notify | Notify daily | complianceBlocked = true |
| roadworthinessExpiry | Notify | Notify daily | complianceBlocked = true |
| visaExpiry | Notify | Notify daily | complianceBlocked = true |

When complianceBlocked = true:
- isApproved → false
- Driver excluded from ALL matching queries (Filter #1)
- Cannot accept any jobs

---

## 5. Firebase Deployment Status

### Cloud Function
- **URL:** https://api-h6acdw3itq-ww.a.run.app
- **Region:** me-central1 (Doha, Qatar)
- **Runtime:** Node.js 22 (2nd Gen)
- **Memory:** 512 MiB
- **Timeout:** 120 seconds
- **Deploy status:** SUCCESS

### Firestore Rules
- New collections: garage_requests, garage_live_requests, driver_discipline_log, notifications
- **Deploy status:** SUCCESS

### Firestore Indexes
- 16 composite indexes across 6 collections
- **Deploy status:** SUCCESS

---

## 6. File Path Reference

```
RoadResQ/
├── backend/
│   ├── utils/
│   │   ├── matchingEngine.js       ← Week 4: 10-filter, geo-radius, ETA
│   │   ├── pricingEngine.js        ← Week 4: integer halala pricing
│   │   ├── disciplineEngine.js     ← Week 4: NEW
│   │   └── serviceEngine.js
│   ├── controllers/
│   │   ├── garageController.js     ← Week 4: NEW
│   │   ├── jobController.js        ← Week 4: updated
│   │   ├── quoteController.js
│   │   └── driverController.js
│   ├── models/
│   │   ├── driverModel.js          ← Week 4: +7 capability fields
│   │   └── jobModel.js             ← Week 4: +15 logistics fields
│   └── routes/
│       ├── garageRoutes.js         ← Week 4: NEW
│       ├── disciplineRoutes.js     ← Week 4: NEW
│       ├── jobRoutes.js
│       ├── quoteRoutes.js
│       ├── driverRoutes.js
│       └── authRoutes.js
│
├── functions/                      ← Firebase Cloud Functions (sync from backend/)
│   └── index.js                    ← Week 4: v3.0.0
│
├── firestore.rules                 ← Week 4: +4 new collection rules
└── firestore.indexes.json          ← Week 4: 16 indexes deployed
```

---

## 7. Logic Bug Audit — 6 Fixes Applied

| # | Bug | Fix | File |
|---|---|---|---|
| 1 | const requiredTruckType re-assigned in garage urgency block → TypeError | Changed to let | jobModel.js |
| 2 | functions/ only had v1-3 routes (garageRoutes + disciplineRoutes missing) | Full rsync backend/ → functions/ | functions/ (all) |
| 3 | functions/utils/matchingEngine.js was old v1 (no geo, no compliance) | Overwritten with Week 4 version | matchingEngine.js |
| 4 | firestore.indexes.json was empty (example comments only) | Written 16 real composite indexes | firestore.indexes.json |
| 5 | checkDriverJobCompatibility() did not check compliance before vehicle spec | New engine runs compliance first | matchingEngine.js |
| 6 | Cloud Function timeout 60s insufficient for compliance-all batch | Increased to 120s | functions/index.js |

---

## 8. End-to-End Walkthrough — SUV Tow from Basement Parking

**Scenario:** SUV broken down in West Bay Basement P2, tow to The Pearl, 12km. Basement has 2100mm clearance limit.

**Step 1 — Customer creates job:**
```json
POST /api/jobs
{
  "userId": "user_abc",
  "vehicleType": "suv",
  "pickup": "West Bay Basement P2",
  "pickupCoords": { "lat": 25.3388, "lng": 51.5074 },
  "drop": "The Pearl Tower A",
  "distanceKm": 12,
  "isRestrictedArea": true,
  "clearanceHeightMm": 2100
}
```

**Step 2 — System calculates price:**
```
SUV base fare:       30000 hl  (QR 300.00)
12km × 600 hl/km:    7200 hl  (QR  72.00)
─────────────────────────────────────────
Total:               37200 hl  (QR 372.00)
```

**Step 3 — Matching engine finds compatible drivers:**
- Queries Firestore: online + approved + available
- 10 filters run sequentially
- Filter 4 (geo): keeps only drivers within 10km of lat 25.3388, lng 51.5074
- Filter 5 (height): eliminates any driver whose vehicleHeightMm > 2100
  → Driver X (vehicleHeightMm: 2800) EXCLUDED — truck too tall for basement
  → Driver Y (vehicleHeightMm: 1950) INCLUDED — fits under 2100mm clearance
- Sort: Driver Y (8 years exp, 4.9 rating, 3.2km) ranks #1

**Step 4 — Auto-assign:**
```json
{
  "driverId": "driver_Y",
  "status": "assigned",
  "matchedTruckType": "standard_tow",
  "driverDistanceKm": 3.2,
  "estimatedETA": { "etaMinutes": 5, "isPeakHour": false }
}
```

**Step 5 — Job completes:**
- driver_Y.completedJobs ++
- driver_Y.isAvailable = true
- driver_Y.activeJobId = null

---

## 9. API Base URLs

| Environment | URL |
|---|---|
| Production (Live) | https://api-h6acdw3itq-ww.a.run.app |
| Local Development | http://localhost:3000 |
| Firebase Emulator | http://localhost:5001/roadresq-bd6b0/me-central1/api |

---

*RoadResQ Backend Team — Week 4 Complete*
