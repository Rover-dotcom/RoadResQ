# RoadResQ — Backend Report: Week 8
## New Features + Google Maps Production Integration
**Version:** v9.1.0  
**Date:** June 1, 2026

---

## Changes Made

### 1. Customer Saved Vehicles (Multiple Cars)

Customers can now save up to 10 vehicles in their account. Each vehicle stores the make, model, year, plate number, color, vehicle type (Sedan, SUV, Pickup, etc.), and optional notes. The first vehicle saved automatically becomes the default vehicle. If the default is deleted, the oldest remaining vehicle takes over. Duplicate plate numbers are prevented per user, and only the vehicle owner (or admin) can edit or delete.

**Endpoints:**
- `POST /api/vehicles` — Save a new vehicle
- `GET /api/vehicles` — List all saved vehicles
- `PUT /api/vehicles/:id` — Update vehicle details
- `DELETE /api/vehicles/:id` — Remove a vehicle
- `PUT /api/vehicles/:id/default` — Set as default vehicle

**Files:**
- `backend/controllers/vehicleController.js` — [NEW] Full CRUD + default vehicle logic
- `backend/routes/vehicleRoutes.js` — [NEW] 5 endpoints with auth

---

### 2. Auto Driver Offline Status (5-Minute Inactivity)

The system now automatically sets drivers to "offline" if they haven't sent a GPS update in 5 minutes. This prevents ghost drivers from appearing available when they're actually not using the app. Admin can trigger the check manually via API, and it's designed to run on a scheduled cron job. When a driver is auto-offlined, the system records the reason ("inactivity") and the exact timestamp.

**Endpoint:**
- `POST /api/history/auto-offline` — Admin triggers inactivity check

**File:** `backend/utils/autoDriverEngine.js` — [NEW] checkInactiveDrivers()

---

### 3. Driver Earnings History

Drivers can now view their earnings filtered by period: today, this week, this month, or all time. The response includes total earnings in fils and QR display format (e.g., "QR 250.00"), transaction count, and the full transaction list. Only the driver themselves or admin can access this — other users get a 403 error.

**Endpoint:**
- `GET /api/history/driver-earnings/:id?period=today` — Driver earnings by period

**Computation example:**
- Driver has 3 transactions today: QR 50.00 + QR 75.00 + QR 120.00
- Response: `totalEarnings: 24500` (in fils), `totalDisplay: "QR 245.00"`, `transactionCount: 3`

**Files:**
- `backend/utils/autoDriverEngine.js` — getDriverEarnings()
- `backend/controllers/historyController.js` — [NEW]
- `backend/routes/historyRoutes.js` — [NEW]

---

### 4. Driver Performance Metrics

A performance dashboard API for each driver that calculates live stats from Firestore data:
- Total jobs, completed jobs, cancelled jobs
- Acceptance rate (e.g., "85.7%")
- Cancellation rate (e.g., "5.3%")
- Average rating (e.g., "4.7")
- Average response time in seconds (time from job creation to driver acceptance)
- Today's earnings

**Endpoint:**
- `GET /api/history/driver-performance/:id` — Full performance metrics

**File:** `backend/utils/autoDriverEngine.js` — getDriverPerformance()

---

### 5. Customer Booking History

Customers can view their full booking history (last 50 jobs by default). Each entry shows service type, status, pickup/drop locations, total fare with display format, driver name, driver rating, and timestamps.

**Endpoint:**
- `GET /api/history/bookings?limit=50` — Customer booking history

**File:** `backend/utils/autoDriverEngine.js` — getBookingHistory()

---

### 6. Garage Repair History

Garages can view their repair request history with status, issue description, estimated cost, customer info, and timestamps. Only the garage owner or admin can access.

**Endpoint:**
- `GET /api/history/garage-repairs/:id` — Garage repair history

**File:** `backend/utils/autoDriverEngine.js` — getGarageRepairHistory()

---

### 7. Dispute System Finalization — Evidence Upload, Timeline, Escrow

Three new features added to the existing dispute system:

- **Evidence upload:** Users can add photo URLs, text notes, and chat logs to a dispute. Evidence is appended (never replaced), so multiple submissions are supported. Each note records who added it and when.
- **Timeline tracking:** Every action on a dispute (evidence added, escrow held, resolved) is logged in a timeline array with actor, timestamp, and details.
- **Escrow hold:** Admin can hold funds in escrow during a dispute to prevent the driver from withdrawing before resolution.

**Endpoints:**
- `PUT /api/disputes/:id/evidence` — Upload evidence
- `GET /api/disputes/:id/timeline` — View dispute timeline
- `POST /api/disputes/:id/hold-escrow` — Admin holds funds in escrow

**Files:**
- `backend/controllers/disputeController.js` — Modified (+3 functions)
- `backend/routes/disputeRoutes.js` — Modified (+3 routes)

---

### 8. Google Maps Production Integration

Previously, the Google Maps integration was set up with logic only (Haversine fallback) because we had no API key. Now the Google Cloud account (blackburnxprojects@gmail.com) is fixed and the API keys are active.

**API Keys configured:**

| Platform | Key | Usage |
|---|---|---|
| Backend (Browser key) | `AIzaSyBuJC67qg53u8hRaDyTud7S-EkkOdBfJAU` | Server-side: Directions, Distance Matrix, Geocoding, Places |
| iOS | `AIzaSyBmrGN5ST-5pOYbU3UQDuxob0dzoWHZF-w` | Flutter iOS app (AppDelegate.swift) |
| Android | `AIzaSyA0nNKp7oQ06mawothVuScWIiMaY8Ev6dQ` | Flutter Android app (AndroidManifest.xml) |

**Google APIs enabled on the Browser key (30 total):**
- Directions API ✅
- Distance Matrix API ✅
- Geocoding API ✅
- Places API ✅
- Places API (New) ✅

**How it works:**
- The backend reads `GOOGLE_MAPS_API_KEY` from `backend/.env`
- On startup, the server logs whether the API is active: `[Maps] ✅ Google Maps API active (key: AIzaSyBuJC...fJAU)`
- All map responses are cached for 5 minutes to reduce API cost
- If the API key is missing or fails, the system automatically falls back to Haversine formula (math-based distance estimation with 1.3x road factor)

**Live test results (June 1, 2026):**

| API | Status | Sample Result |
|---|---|---|
| Directions | ✅ Working | Pearl → Airport: real road route with turn-by-turn |
| Distance Matrix | ✅ Working | Pearl → Airport: 28.95 km, 32 mins (real road distance) |
| Reverse Geocode | ✅ Working | 25.368, 51.550 → "53 Malaga Way, Doha, Qatar" |
| Places Autocomplete | ✅ Working | "Katara" → "Katara Cultural Village, High Street, Doha" |
| Forward Geocode | ⏳ Propagating | Takes up to 5 minutes after key restriction update |

**Comparison — Haversine vs Google Maps (Pearl → Hamad Airport):**

| Method | Distance | Duration |
|---|---|---|
| Haversine (old) | 17.58 km (straight line × 1.3) | 27 min (estimated) |
| Google Maps (new) | 28.95 km (actual road route) | 32 min (real traffic) |

**New Maps endpoints added (Week 8):**

- `GET /api/maps/autocomplete?input=The Pearl` — Address search suggestions (for app search bar)
- `GET /api/maps/place-details?placeId=ChIJ...` — Full place details (lat/lng, name, phone, rating)
- `GET /api/maps/driver-eta?driverLat=&driverLng=&pickupLat=&pickupLng=` — Driver ETA to customer pickup

**Files:**
- `backend/.env` — [NEW] Added GOOGLE_MAPS_API_KEY (gitignored, not committed)
- `backend/.env.example` — Modified (added Maps key placeholder + platform reference)
- `backend/utils/mapsEngine.js` — Modified (v9.1.0: startup log, Places Autocomplete, Place Details, Driver ETA)
- `backend/controllers/mapsController.js` — Modified (v9.1.0: +3 handler functions)
- `backend/routes/mapsRoutes.js` — Modified (+3 routes: autocomplete, place-details, driver-eta)

---

### 9. Firestore Indexes Updated

Added 12 new composite indexes for the new collections and queries:

| Collection | Index Fields |
|---|---|
| saved_vehicles | userId + createdAt (DESC) |
| saved_vehicles | userId + plateNumber |
| notifications | userId + createdAt (DESC) |
| notifications | userId + isRead |
| saved_locations | userId + createdAt (DESC) |
| wallet_transactions | walletId + type + createdAt (DESC) |
| drivers | isOnline + lastLocationUpdate |
| idempotency_keys | createdAt |
| backup_logs | startedAt (DESC) |
| disputes | reporterId + createdAt (DESC) |
| garage_requests | garageId + createdAt (DESC) |

**File:** `firestore.indexes.json` — Modified (29 total indexes)

---

### 10. Postman Collection (Week 8)

New Postman collection with all Week 8 endpoints organized by feature:
- Saved Vehicles (6 requests)
- Booking & Earnings History (8 requests)
- Dispute Evidence & Escrow (4 requests)
- Google Maps Production (11 requests with Qatar test coordinates)

**File:** `backend/postman/RoadResQ_Week8_v9.1.postman_collection.json` — [NEW]

---

### 11. Server Infrastructure

- Version bumped from v9.0.0 to v9.1.0
- 24 route modules mounted
- Health check now shows Google Maps status (ACTIVE/FALLBACK)
- New `googleMaps` section in health check response

**File:** `backend/server.js` — Modified

---

## New Firestore Collections (Week 8)

| Collection | Purpose |
|---|---|
| `saved_vehicles` | Customer saved cars (max 10 per user) |

---

## New Files Created

| File | Type | Purpose |
|---|---|---|
| `backend/controllers/vehicleController.js` | Controller | Saved vehicles CRUD |
| `backend/routes/vehicleRoutes.js` | Routes | Vehicle endpoints |
| `backend/controllers/historyController.js` | Controller | Earnings, booking, repair history |
| `backend/routes/historyRoutes.js` | Routes | History endpoints |
| `backend/utils/autoDriverEngine.js` | Engine | Auto-offline, earnings, performance |
| `backend/postman/RoadResQ_Week8_v9.1.postman_collection.json` | Postman | Week 8 API testing |

## Modified Files

| File | Changes |
|---|---|
| `backend/server.js` | v9.1.0, +2 route mounts, Maps status in health check |
| `backend/utils/mapsEngine.js` | v9.1.0, startup log, +3 functions (autocomplete, place details, driver ETA) |
| `backend/controllers/mapsController.js` | v9.1.0, +3 handlers |
| `backend/routes/mapsRoutes.js` | +3 routes (autocomplete, place-details, driver-eta) |
| `backend/controllers/disputeController.js` | +3 functions (evidence, timeline, escrow) |
| `backend/routes/disputeRoutes.js` | +3 routes |
| `backend/.env.example` | Added Maps key placeholder |
| `firestore.indexes.json` | +12 composite indexes (29 total) |
