# RoadResQ — Week 6 Backend Report (Improved v8.0.0)
**Version:** v8.0.0 | **Deployed:** Firebase Cloud Functions | **Region:** me-central1 (Doha, Qatar)
**Date Completed:** 2026-05-17 | Firebase: Deployed | GitHub: Pushed | Postman: Updated

---

## Live Links

| Resource | URL |
|---|---|
| **Live API** | https://api-h6acdw3itq-ww.a.run.app |
| **Firebase Console** | https://console.firebase.google.com/project/roadresq-bd6b0/overview |
| **GitHub Branch** | https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev |
| **Postman Collection** | `docs/RoadResQ_API.postman_collection.json` |

---

## Completion Checklist

| Task | Status |
|---|---|
| Google Maps integration with automatic Haversine fallback | Done |
| Double-entry wallet system (deposit, debit, hold, release, refund) | Done |
| Driver payout system with admin approval flow | Done |
| Real-time dispatch engine with auto-timeout + radius expansion | Done |
| Route recalculation on driver deviation | Done |
| Trip progress tracking (percentage-based) | Done |
| Batch GPS updates with 3-second throttle | Done |
| Payment receipts with QAR fare breakdown | Done |
| Stress testing (10 concurrent bookings) | Done |
| GPS edge case testing (weak signal, basement, drift) | Done |
| Request ID tracing (X-Request-Id header) | Done |
| Live GPS tracking via Firebase Realtime Database | Done |
| Nearby driver search with Haversine formula | Done |
| Traffic-adjusted ETA (Qatar peak-hour buffers) | Done |
| Driver arrival auto-detection (< 100m threshold) | Done |
| Rate limiting (100 req/min per IP) | Done |
| Postman collection updated to v8.0.0 | Done |
| Firestore indexes for wallet/payout/dispatch | Done |
| Firestore security rules for 4 new collections | Done |

---

## Key Highlights

- Google Maps integration auto-detects API key availability — uses Distance Matrix API in production, Haversine fallback in development (`backend/utils/mapsEngine.js`)
- Wallet system uses Firestore Transactions for atomic double-entry ledger operations (`backend/utils/walletEngine.js`)
- Driver payouts require QR 50 minimum and enforce 24-hour cooldown between requests (`backend/utils/payoutEngine.js`)
- Dispatch engine offers jobs to nearest driver first, auto-escalates radius (10km -> 15km -> 20km) on timeouts (`backend/utils/dispatchEngine.js`)
- Route recalculation triggers when driver GPS deviates more than 500m from planned route (`backend/utils/locationEngine.js`)
- Trip progress calculates percentage completion based on remaining distance vs total distance (`backend/utils/locationEngine.js`)
- GPS batch updates throttle to 1 write per 3 seconds to reduce Firestore/RTDB costs (`backend/utils/locationEngine.js`)
- Payment receipt includes full fare breakdown: base fare, distance fare, surge fare, platform fee (10%), driver payout (`backend/utils/paymentEngine.js`)
- Maps API responses are cached with 5-minute TTL to reduce Google API calls (`backend/utils/mapsEngine.js`)
- Every HTTP request gets a UUID (X-Request-Id header) for end-to-end debugging (`backend/server.js`)

---

## New Files

### New Engines (`backend/utils/`)
| File | What It Does |
|---|---|
| `mapsEngine.js` | Google Maps Distance Matrix + Directions API wrapper with Haversine fallback, geocoding, reverse geocoding, response caching (5-min TTL) |
| `walletEngine.js` | Double-entry wallet ledger — DEPOSIT, DEBIT, CREDIT, HOLD, RELEASE, REFUND, WITHDRAWAL operations with Firestore Transactions |
| `payoutEngine.js` | Driver withdrawal request system — QR 50 min threshold, 24h cooldown, admin approve/reject state machine |
| `dispatchEngine.js` | Automated job dispatch — finds nearby drivers, sends offers, handles accept/decline/timeout, radius expansion (10/15/20 km) |

### New Controllers (`backend/controllers/`)
| File | What It Does |
|---|---|
| `walletController.js` | 5 wallet endpoints: get balance, transactions, deposit, withdraw, list all |
| `payoutController.js` | 5 payout endpoints: request, pending list, approve, reject, driver history |
| `dispatchController.js` | 5 dispatch endpoints: start dispatch, accept, decline, cancel, get status |
| `mapsController.js` | 6 maps endpoints: route, distance matrix, geocode, reverse geocode, polyline, status |

### New Routes (`backend/routes/`)
| File | Base Path |
|---|---|
| `walletRoutes.js` | `/api/wallet` |
| `payoutRoutes.js` | `/api/payouts` |
| `dispatchRoutes.js` | `/api/dispatch` |
| `mapsRoutes.js` | `/api/maps` |

### Modified Files
| File | What Changed |
|---|---|
| `backend/server.js` | v8.0.0 — 4 new route groups (wallet, payouts, dispatch, maps), request ID middleware, updated health check |
| `backend/utils/paymentEngine.js` | Added `getPaymentReceipt()` for fare breakdown and `releasePaymentWithWallet()` for wallet-integrated payment release |
| `backend/utils/locationEngine.js` | Added `recalculateRoute()`, `getTripProgress()`, `setDriverOnline()`, `batchUpdateLocations()`, `getRoutePolyline()` |
| `backend/controllers/trackingController.js` | 5 new endpoints: recalculate route, trip progress, polyline, go online, batch GPS update |
| `backend/controllers/integrationController.js` | 5 new test endpoints: test all services, wallet validation, GPS edge cases, stress test, route recalculation test |
| `backend/routes/trackingRoutes.js` | 5 new routes for recalculation, progress, polyline, online toggle, batch update |
| `backend/routes/integrationRoutes.js` | 5 new test routes |
| `functions/index.js` | v8.0.0 — synced all new routes, added request ID middleware |
| `firestore.rules` | 4 new collection rules: wallets, wallet_transactions, payouts, dispatch_state |
| `firestore.indexes.json` | 4 new composite indexes for wallet_transactions, payouts, wallets |
| `docs/RoadResQ_API.postman_collection.json` | 5 new Postman folders: Wallet, Payouts, Dispatch, Maps, Integration Tests v8.0.0 |

---

## Wallet System (`backend/utils/walletEngine.js`)

Each user, driver, and garage gets a wallet with two balances: `availableBalance` (spendable) and `heldBalance` (locked for pending jobs). All operations are atomic using Firestore Transactions to prevent race conditions.

**Supported operations:**
```
DEPOSIT    — add funds to available balance (e.g., customer tops up)
DEBIT      — subtract from available balance (e.g., platform fee)
CREDIT     — add to available balance (e.g., driver earnings)
HOLD       — move from available to held (e.g., job escrow)
RELEASE    — move from held to available (e.g., job cancelled, refund hold)
REFUND     — add back to available balance (e.g., dispute resolution)
WITHDRAWAL — subtract from available balance (e.g., driver cashes out)
```

**Firestore collections:**
- `wallets/{userId}` — balance document (availableBalance, heldBalance, totalEarned, totalSpent, currency: QAR)
- `wallet_transactions/{txnId}` — immutable ledger entry (walletId, type, amount, balanceBefore, balanceAfter, reference, timestamp)

**Endpoints:**

| Endpoint | What It Does |
|---|---|
| `GET /api/wallet/:userId` | Get wallet balance and metadata |
| `GET /api/wallet/:userId/transactions` | Get transaction history (limit 50) |
| `POST /api/wallet/:userId/deposit` | Deposit funds (amount in fils) |
| `POST /api/wallet/:userId/withdraw` | Withdraw from available balance |
| `GET /api/wallet/all` | Admin: list all wallets |

---

## Driver Payout System (`backend/utils/payoutEngine.js`)

Drivers can request withdrawal of their earnings. The system enforces a minimum amount (QR 50 = 5000 fils) and a 24-hour cooldown between requests. Admin must approve or reject each request.

**Payout state machine:**
```
pending -> approved -> completed
pending -> rejected
```

**Business rules:**
- Minimum withdrawal: QR 50 (5000 fils)
- Cooldown: 24 hours between requests
- Available balance must cover the requested amount
- Admin provides transaction reference on approval

**Endpoints:**

| Endpoint | What It Does |
|---|---|
| `POST /api/payouts/request` | Driver submits withdrawal request |
| `GET /api/payouts/pending` | Admin: list pending payout requests |
| `POST /api/payouts/:id/approve` | Admin approves — deducts from wallet, marks completed |
| `POST /api/payouts/:id/reject` | Admin rejects with reason |
| `GET /api/payouts/driver/:driverId` | Get all payouts for a driver |

---

## Dispatch Engine (`backend/utils/dispatchEngine.js`)

Automated job dispatch that finds nearby drivers, sends offers, and handles timeouts. If the first driver doesn't respond, the system expands the search radius and offers to the next closest driver.

**Dispatch state machine:**
```
searching -> offered -> accepted
searching -> offered -> declined -> searching (next driver)
searching -> offered -> timeout  -> searching (expand radius)
searching -> no_drivers_found
```

**Radius expansion:**
```
Round 1: 10 km radius
Round 2: 15 km radius
Round 3: 20 km radius
After 3 rounds: no_drivers_found
```

**Offer timeout:** 60 seconds per driver

**Endpoints:**

| Endpoint | What It Does |
|---|---|
| `POST /api/dispatch/:jobId` | Start dispatch — find drivers, send first offer |
| `POST /api/dispatch/:jobId/accept` | Driver accepts the offer |
| `POST /api/dispatch/:jobId/decline` | Driver declines — auto-offers next driver |
| `POST /api/dispatch/:jobId/cancel` | Cancel dispatch entirely |
| `GET /api/dispatch/:jobId/status` | Get current dispatch state |

---

## Google Maps Integration (`backend/utils/mapsEngine.js`)

The maps engine auto-detects whether `GOOGLE_MAPS_API_KEY` is set. If available, it uses the real Google API. Otherwise, it uses Haversine-based calculations as a fallback. All responses are cached for 5 minutes.

**Available methods:**

| Function | Google API | Haversine Fallback |
|---|---|---|
| `getRoute(origin, dest)` | Distance Matrix API | Haversine * 1.3x road factor |
| `getDistanceMatrix(origins, dests)` | Distance Matrix API | Haversine per pair |
| `geocode(address)` | Geocoding API | Returns null (not available offline) |
| `reverseGeocode(lat, lng)` | Geocoding API | Returns approximate area name |
| `getPolyline(origin, dest)` | Directions API | Straight-line 2 points |

**Endpoints:**

| Endpoint | What It Does |
|---|---|
| `GET /api/maps/route` | Get route with distance/ETA between two points |
| `POST /api/maps/distance-matrix` | Calculate distances between multiple origin-destination pairs |
| `GET /api/maps/geocode` | Convert address to coordinates |
| `GET /api/maps/reverse-geocode` | Convert coordinates to address |
| `GET /api/maps/polyline` | Get route polyline for map drawing |
| `GET /api/maps/status` | Check Google Maps API status (live/fallback) |

---

## Upgraded Tracking (`backend/controllers/trackingController.js`)

5 new tracking endpoints added to the existing tracking system.

| Endpoint | What It Does |
|---|---|
| `POST /api/tracking/recalculate/:jobId` | Recalculates route when driver deviates from planned path |
| `GET /api/tracking/progress/:jobId` | Returns trip completion percentage based on remaining vs total distance |
| `GET /api/tracking/polyline` | Returns route polyline for Flutter map rendering |
| `POST /api/tracking/driver/:driverId/online` | Sets driver to online (adds to available pool) |
| `POST /api/tracking/batch-update` | Accepts multiple GPS updates in a single request (3-sec throttle) |

---

## Upgraded Integration Tests (`backend/controllers/integrationController.js`)

5 new test endpoints for comprehensive validation.

| Endpoint | What It Does |
|---|---|
| `POST /api/test/test-all-services` | Creates test job for each of the 6 service types, validates pricing and matching |
| `GET /api/test/wallet-validation` | Checks all wallet balances are non-negative, counts transactions per wallet |
| `GET /api/test/gps-edge-cases` | Tests 6 GPS scenarios: normal, weak signal, basement, teleportation, connection lost, rapid updates |
| `POST /api/test/stress-test` | Simulates 10 concurrent bookings (create + delete) — measures throughput and avg response time |
| `GET /api/test/route-recalculation` | Tests route recalculation with real Doha coordinates (The Pearl to Lusail with a deviation) |

---

## Payment Receipt (`backend/utils/paymentEngine.js`)

New `getPaymentReceipt(jobId)` function generates a formatted receipt:

```
Receipt ID:     RRQ-ABC12345
Service:        towing
Currency:       QAR
Base Fare:      QR 50.00
Distance Fare:  QR 15.00
Surge Fare:     QR 0.00
Total Charged:  QR 65.00
Platform Fee:   QR 6.50 (10%)
Driver Payout:  QR 58.50
```

---

## Firestore Changes

**New Security Rules** in `firestore.rules`:
- `wallets/{userId}` — owner or admin can read, admin SDK handles writes
- `wallet_transactions/{txnId}` — signed-in users can read, admin SDK only writes
- `payouts/{payoutId}` — signed-in users can read, drivers can create, admin approves/rejects
- `dispatch_state/{jobId}` — signed-in users can read/update (driver accepts/declines)

**New Composite Indexes** in `firestore.indexes.json`:
- `wallet_transactions` — (walletId ASC, createdAt DESC) for transaction history queries
- `payouts` — (driverId ASC, requestedAt DESC) for driver payout history
- `payouts` — (status ASC, requestedAt ASC) for admin pending queue
- `wallets` — (role ASC, updatedAt DESC) for admin wallet list

---

## Firebase Status

| Item | Status |
|---|---|
| Cloud Functions v8.0.0 (me-central1) | Deployed |
| Firestore Security Rules (4 new collections) | Deployed |
| Firestore Indexes (4 new composite) | Deployed |
| Firebase Auth — Email/Password | Enabled |
| Firebase Auth — Google Sign-In | Enabled |
| Firebase Realtime Database | Used for `/locations` and `/job_tracking` |

**Production URL:** `https://api-h6acdw3itq-ww.a.run.app`

---

## GitHub

**Branch:** `backend-dev`
**Repo:** https://github.com/Rover-dotcom/RoadResQ
