# RoadResQ — Backend Developer Report
## Week 1 → Week 3 Completion + Technical Deep Dive

**Developer:** Cedric (blackburnxprojects@gmail.com)  
**Branch:** `backend-dev` → https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev  
**Live API:** https://api-h6acdw3itq-ww.a.run.app  
**Database:** Firebase Firestore — me-central1 (Doha, Qatar 🇶🇦)

---

## ✅ WEEK 1 TASK VERIFICATION — All Complete

| Task | Requirement | Status | File/Proof |
|---|---|---|---|
| Task 1 | Setup Backend | ✅ Done | `backend/` folder, `npm init`, dependencies |
| Task 2 | Create Server | ✅ Done | `backend/server.js` — Express on port 3000 |
| Task 3 | Create Auth APIs | ✅ Done | `POST /api/auth/register`, `POST /api/auth/login` |
| Task 4 | Folder Structure (controllers/routes/models) | ✅ Done | `backend/controllers/`, `backend/routes/`, `backend/models/` |
| Task 5 | Test APIs with Postman | ✅ Done | `docs/RoadResQ_API.postman_collection.json` — 25+ tested endpoints |
| Task 6 | Push to GitHub | ✅ Done | `backend-dev` branch, commit history on GitHub |

---

## ✅ WEEK 2 TASK VERIFICATION — All Complete

| Task | Requirement | Status | File/Proof |
|---|---|---|---|
| Task 1 | User Model | ✅ Done | `backend/models/userModel.js` |
| Task 1 | Driver Model | ✅ Done | `backend/models/driverModel.js` |
| Task 1 | Job Model | ✅ Done | `backend/models/jobModel.js` |
| Task 2 | `POST /jobs` — Create Job | ✅ Done | `backend/controllers/jobController.js` |
| Task 2 | `GET /jobs` — Get Jobs | ✅ Done | With filters: userId, driverId, status |
| Task 3 | Connect Database | ✅ Done | **Firebase Firestore** (discussed & approved — Doha, Qatar) |
| Task 4 | Test `POST /jobs` | ✅ Done | Postman collection — "Create Job" request |
| Task 4 | Test `GET /jobs` | ✅ Done | Postman collection — "Get All Jobs" request |
| Task 5 | Prepare for Flutter Integration | ✅ Done | `docs/FRONTEND_INTEGRATION.md` — Flutter code examples included |

---

## ✅ WEEK 3 TASK VERIFICATION — All Complete + EXCEEDED

| Task | Requirement | Status | File |
|---|---|---|---|
| 1 | Category Engine (`getCategory()`) | ✅ Done + Enhanced | `backend/utils/categoryEngine.js` + `serviceEngine.js` |
| 2 | `POST /jobs` — detect category + price + save | ✅ Done | `backend/controllers/jobController.js` |
| 3 | Job Model updated (serviceType, vehicleType, category, price, status, driverId) | ✅ Done | `backend/models/jobModel.js` |
| 4 | Basic Pricing Engine | ✅ Done + Enhanced | `backend/utils/pricingEngine.js` |
| 5 | Driver Filtering (online + approved + vehicleType) | ✅ Done + Enhanced | `backend/utils/matchingEngine.js` |
| 6 | `GET /jobs/available` | ✅ Done | `backend/routes/jobRoutes.js` |
| 7 | `PUT /jobs/:id/accept` | ✅ Done | `backend/controllers/jobController.js` |
| 8 | `GET /jobs?userId=` and `GET /jobs?driverId=` | ✅ Done | Job history by user and driver |
| 9 | `POST /quotes` — Quote Request API | ✅ Done | `backend/controllers/quoteController.js` |
| 10 | `PUT /drivers/status` — Online/Offline | ✅ Done | `backend/controllers/driverController.js` |
| 11 | Standard API Response `{ status, data }` | ✅ Done | All controllers use this format |
| 12 | Error Handling (missing fields, invalid data) | ✅ Done | All controllers validate inputs |
| **BONUS** | Firebase deployment (me-central1, Doha, Qatar) | ✅ Done | `functions/index.js` — live now |
| **BONUS** | Full Quote Lifecycle (submit → respond → accept/reject) | ✅ Done | `backend/controllers/quoteController.js` |
| **BONUS** | Driver Rating System | ✅ Done | `PUT /api/jobs/:id/rate-driver` |
| **BONUS** | 10 Firestore Composite Indexes | ✅ Done | `firestore.indexes.json` |
| **BONUS** | Security Rules | ✅ Done | `firestore.rules` |

---

## 📁 Complete File Structure on GitHub

```
backend-dev branch → /backend/
├── server.js                    ← Express server entry point
├── config/
│   └── firebase.js              ← Firebase Admin SDK init (auto-credentials)
├── controllers/
│   ├── authController.js        ← Register + Login
│   ├── jobController.js         ← Full job lifecycle
│   ├── driverController.js      ← Driver management
│   └── quoteController.js       ← Quote lifecycle
├── models/
│   ├── userModel.js             ← Customer schema
│   ├── driverModel.js           ← Driver + truck schema
│   └── jobModel.js              ← Job schema with pricing
├── routes/
│   ├── authRoutes.js
│   ├── jobRoutes.js
│   ├── driverRoutes.js
│   └── quoteRoutes.js
└── utils/
    ├── serviceEngine.js         ← Service categories + vehicle specs
    ├── categoryEngine.js        ← Vehicle → category mapping
    ├── pricingEngine.js         ← Price calculation per vehicle
    └── matchingEngine.js        ← Smart driver matching

/functions/                      ← Deployed to Firebase Cloud Functions
/docs/                           ← Frontend documentation
/firestore.rules                 ← Database security
/firestore.indexes.json          ← Query indexes
/firebase.json                   ← Firebase project config
```

---

## 🧠 TECHNICAL LOGIC EXPLANATIONS

### 1. Category Engine — How Vehicle Types Are Classified

**File:** `backend/utils/categoryEngine.js` + `serviceEngine.js`

When a customer books a job, the backend automatically detects what kind of service is needed based on the vehicle type. No manual input from frontend.

```
Vehicle Type → Category → Truck Required

Motorcycle  → "tow" → light_tow   (up to 500kg)
ATV         → "tow" → light_tow   (up to 500kg)
Sedan       → "tow" → standard_tow (up to 2,500kg)
SUV         → "tow" → standard_tow (up to 2,500kg)
4x4         → "tow" → heavy_tow   (up to 4,000kg)

Skid Loader → "heavy_equipment" → flatbed_small  (up to 5,000kg)
JCB         → "heavy_equipment" → flatbed_heavy  (up to 15,000kg)
Excavator   → "heavy_equipment" → flatbed_heavy  (up to 15,000kg)

Garage Urgent → "garage"  → service_van
Container     → "quote_industrial" → QUOTE REQUIRED
```

**Why this matters:** The driver only sees jobs his truck can physically handle. A light tow truck driver will NEVER see a job to move a JCB.

---

### 2. Pricing Engine — How the Price is Calculated

**File:** `backend/utils/pricingEngine.js`

```
FORMULA:
  Total Price = Base Fare + (Distance in KM × Per KM Rate)

EXAMPLE — Sedan, 10km:
  Base Fare    = ₱250
  Distance     = 10km × ₱5/km = ₱50
  TOTAL        = ₱300  ✅

EXAMPLE — SUV, 15km:
  Base Fare    = ₱300
  Distance     = 15km × ₱6/km = ₱90
  TOTAL        = ₱390
```

**Full Price Table:**

| Vehicle | Base Fare | Per KM | Example (10km) |
|---|---|---|---|
| Motorcycle | ₱150 | ₱3/km | ₱180 |
| ATV | ₱180 | ₱4/km | ₱220 |
| Sedan | ₱250 | ₱5/km | ₱300 |
| SUV | ₱300 | ₱6/km | ₱360 |
| 4x4 | ₱380 | ₱8/km | ₱460 |
| Garage Urgent | ₱300 | ₱5/km | ₱350 |
| Skid Loader | ₱800 | ₱12/km | ₱920 |
| Telehandler | ₱1,200 | ₱16/km | ₱1,360 |
| JCB | ₱1,500 | ₱18/km | ₱1,680 |
| Excavator | ₱2,000 | ₱22/km | ₱2,220 |

**Quote Required (no auto-price):**  
Container, Generator, Precast Block, Pallets, Industrial Others, Garage Standard, Heavy Others

---

### 3. Matching Engine — How Drivers Are Selected

**File:** `backend/utils/matchingEngine.js`

When a job is created, the system automatically finds the best driver. It works in layers:

```
LAYER 1 — Hard Filters (driver MUST pass all):
  ✔ isOnline = true       → Driver is available right now
  ✔ isApproved = true     → Admin has verified the driver
  ✔ isAvailable = true    → Not currently on another job
  ✔ truckType matches     → Truck can physically carry the vehicle

LAYER 2 — Capacity Check:
  ✔ driver.maxCapacityKg >= job.vehicle.estimatedWeightKg

  Example: Sedan job requires 1,400kg minimum capacity
           light_tow driver (500kg max) → REJECTED
           standard_tow driver (2,500kg max) → ACCEPTED ✅

LAYER 3 — Upgrade Logic (special rule):
  A heavy_tow driver CAN take standard_tow and light_tow jobs
  A standard_tow driver CAN take light_tow jobs
  (Bigger truck = capable of smaller jobs)

LAYER 4 — Ranking (best driver wins):
  Sort remaining drivers by: rating (highest first)
  Top driver gets auto-assigned to the job
```

**Example flow:**
```
Job: Tow a Sedan (weight: 1,400kg)
Required truck: standard_tow

Drivers checked:
  Driver A → light_tow, 500kg cap → ❌ Too small
  Driver B → standard_tow, 2,500kg cap, rating 4.8, online ✅ → ASSIGNED
  Driver C → standard_tow, 2,500kg cap, rating 4.2, online ✅ → Backup
```

---

### 4. Job Status Lifecycle — How a Job Moves

```
[pending]
  ↓ Auto-assign finds driver
[assigned]
  ↓ Driver confirms
[accepted]
  ↓ Driver starts driving
[in_progress]
  ↓ Vehicle at garage
[at_garage]
  ↓ Job done
[completed]
  ↓ Customer rates driver
★ Rating saved to driver profile
```

**For Quote jobs:**
```
[quote_pending]
  ↓ Admin reviews and sets price
[quoted]
  ↓ Customer accepts
[accepted_by_customer]
  ↓ Matching engine runs
[assigned] → [accepted] → [in_progress] → [completed]
```

---

### 5. Quote System — How Quotes Work

**File:** `backend/controllers/quoteController.js`

Used for: Garage Standard, Heavy Industrial, Container, Generator, etc.

```
Step 1: Customer submits quote request
        POST /api/quotes
        { vehicleType, description, pickup, drop, weight }

Step 2: Admin reviews and sets price
        PUT /api/quotes/:id/respond
        { quotedPrice: 5000, adminNotes: "Needs crane, +driver fee" }

Step 3: Customer sees price and decides
        PUT /api/quotes/:id/accept   → Creates real job automatically
        PUT /api/quotes/:id/reject   → Quote closed, no job created

Step 4: If accepted, matching engine runs and assigns a driver
```

---

### 6. Database — What is Stored in Firestore

**Collections (equivalent to "tables" in SQL):**

```
users/
  {uid}/
    name, email, phone, role, createdAt

drivers/
  {uid}/
    name, truckType, maxCapacityKg, serviceTypes[],
    isOnline, isApproved, isAvailable, rating,
    truckModel, truckPlate, licenseNumber

jobs/
  {jobId}/
    userId, driverId, vehicleType, serviceType,
    category, truckTypeRequired, estimatedWeightKg,
    pickup, drop, distanceKm,
    price, currency, pricingBreakdown{},
    status, timestamps{}

quotes/
  {quoteId}/
    userId, vehicleType, serviceType, itemDescription,
    estimatedWeight, urgency, status,
    quotedPrice, adminNotes, customerNotes
```

**10 Indexes** pre-built for fast queries:
- Jobs by userId + createdAt
- Jobs by driverId + status
- Jobs by status + truckTypeRequired
- Drivers by isOnline + truckType + rating
- Quotes by userId + status
- (and 5 more)

---

## 🚀 Deployment Summary

| Service | Location | URL |
|---|---|---|
| **REST API** | Cloud Functions — me-central1 (Doha) | `https://api-h6acdw3itq-ww.a.run.app` |
| **Database** | Firestore — me-central1 (Doha) | Firebase Console |
| **Auth** | Firebase Authentication | Firebase Console |
| **Runtime** | Node.js 22 — 2nd Gen Cloud Run | Auto-scaling |

---

## 📊 Numbers

| Metric | Count |
|---|---|
| Total API Endpoints | **25+** |
| Service Categories | **4** (Tow, Garage, Heavy, Quote) |
| Vehicle Types Supported | **14** |
| Truck Types | **6** |
| Firestore Collections | **4** |
| Composite Indexes | **10** |
| Weeks of tasks completed | **3 (+ extras from Week 5 & 6)** |
| Lines of backend code | **~2,500** |

---

## 📁 GitHub Paths for Presentation

**Repository:** https://github.com/Rover-dotcom/RoadResQ  
**Branch:** `backend-dev`

| What to Show | Path |
|---|---|
| Server entry | `backend/server.js` |
| Auth APIs | `backend/controllers/authController.js` |
| Job APIs | `backend/controllers/jobController.js` |
| Service logic | `backend/utils/serviceEngine.js` |
| Pricing logic | `backend/utils/pricingEngine.js` |
| Matching logic | `backend/utils/matchingEngine.js` |
| Quote system | `backend/controllers/quoteController.js` |
| Firebase deploy | `functions/index.js` |
| Security rules | `firestore.rules` |
| All endpoints doc | `docs/API_DOCUMENTATION.md` |
| Frontend guide | `docs/FRONTEND_INTEGRATION.md` |
| Postman collection | `docs/RoadResQ_API.postman_collection.json` |

---

*Report generated: April 2026 | Backend Developer: Cedric*
