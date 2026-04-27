# RoadResQ — Frontend Integration Guide (Week 4 / v3.0.0)
## For: Flutter Frontend Developer

**Base URL (Production):** `https://api-h6acdw3itq-ww.a.run.app`  
**Firebase Project:** `roadresq-bd6b0`  
**Region:** me-central1 (Doha, Qatar)

---

## Quick Setup

### 1. Postman
Import the file `RoadResQ_API_v3_Postman.json` into Postman.
- File location: `docs/RoadResQ_API_v3_Postman.json`
- All 35 requests are pre-built with real example bodies
- Set Postman Environment variable: `baseUrl = https://api-h6acdw3itq-ww.a.run.app`

### 2. Flutter `http` base client
```dart
const String baseUrl = 'https://api-h6acdw3itq-ww.a.run.app';

// Standard headers for all requests
Map<String, String> get headers => {
  'Content-Type': 'application/json',
};
```

---

## Pricing: Halala Integer Model

> All prices from the API are **integers in halala** (1/100 of a QAR).

```dart
// Helper — use everywhere money is displayed
String toQAR(int halala) {
  return 'QR ${(halala / 100).toStringAsFixed(2)}';
}

// Example
toQAR(29000)  // → "QR 290.00"
toQAR(5000)   // → "QR 50.00"  (no-show penalty)
toQAR(200000) // → "QR 2000.00" (excavator base)
```

---

## Enums to Hardcode in Flutter

### Job Status (in order)
```dart
enum JobStatus {
  pending,
  assigned,
  accepted,
  inProgress,      // 'in_progress'
  atGarage,        // 'at_garage'
  onSite,          // 'on_site'
  completed,
  cancelled,
  quotePending,    // 'quote_pending'
  quoted,
}
```

### Service Types
```dart
enum ServiceType { tow, garage, heavy_equipment, quote_industrial }
```

### Vehicle Types (Tow)
```dart
// Tow service
['motorcycle', 'atv', 'sedan', 'suv', '4x4']

// Heavy equipment
['skid_loader', 'telehandler', 'jcb', 'excavator']

// Custom
['Others']
```

### Truck Types (for Driver registration)
```dart
['light_tow', 'standard_tow', 'heavy_tow', 'flatbed_small', 'flatbed_heavy', 'service_van']
```

### Equipment Types (Week 4 — Driver)
```dart
['boom_truck', 'flatbed', 'flatbed_tow']
```

### Garage Request Status (Week 4)
```dart
enum GarageRequestStatus {
  pending,
  collectingEstimates,   // 'collecting_estimates'
  accepted,
  onTheWay,              // 'on_the_way'
  inProgress,            // 'in_progress'
  completed,
  cancelled,
}
```

---

## API Reference

### 🔐 Auth

#### Register User
```
POST /api/auth/register
```
```json
Body:
{
  "name": "Ahmed Al-Mansoori",
  "email": "ahmed@example.com",
  "password": "securePass123",
  "phone": "+97455512345",
  "role": "customer"
}

Response 201:
{
  "status": "success",
  "data": {
    "uid": "firebaseUID",
    "name": "Ahmed Al-Mansoori",
    "email": "ahmed@example.com",
    "role": "customer"
  }
}
```

#### Login (Firebase ID Token)
```
POST /api/auth/login
```
```json
Body:
{
  "idToken": "FIREBASE_CLIENT_ID_TOKEN"
}
```
> **Flutter flow:** Call `FirebaseAuth.instance.signInWithEmailAndPassword()` first,
> then get `await user.getIdToken()` and send that token here.

---

### 🚗 Jobs

#### Get Service Info (call on startup for dropdowns)
```
GET /api/jobs/service-info
```
Returns full vehicle catalogue — vehicle types, service categories, required truck types, pricing keys.
**Call this once at startup and cache it.**

#### Get Price Estimate
```
GET /api/jobs/price-estimate?vehicleType=sedan&distanceKm=8
```
```json
Response:
{
  "requiresQuote": false,
  "vehicleType": "sedan",
  "serviceType": "tow",
  "price": 29000,
  "priceDisplay": "QR 290.00",
  "breakdown": {
    "baseFare": 25000,
    "baseFareDisplay": "QR 250.00",
    "distanceKm": 8,
    "perKm": 500,
    "distanceCharge": 4000,
    "distanceChargeDisplay": "QR 40.00",
    "total": 29000,
    "totalDisplay": "QR 290.00"
  }
}
```

#### Create Job — Full Body Schema
```
POST /api/jobs
```
```json
{
  "userId": "string (required)",
  "pickup": "string (required)",
  "drop": "string (required)",

  "vehicleType": "sedan | suv | 4x4 | motorcycle | atv | skid_loader | telehandler | jcb | excavator | Others",
  "serviceType": "tow | garage | heavy_equipment | quote_industrial",

  "distanceKm": 8.5,
  "vehicleModel": "Toyota Camry 2022",
  "vehiclePlate": "A 12345",
  "vehicleColor": "White",
  "vehicleCondition": "Engine failure",
  "customerNotes": "Keys in glove box",
  "garageUrgency": "standard | urgent",

  "pickupCoords": { "lat": 25.3388, "lng": 51.5074 },
  "dropCoords": { "lat": 25.3699, "lng": 51.5244 },

  "customItem": "Electric Scooter",
  "customDetails": "80kg, folds flat",
  "customPhotoUrls": ["https://..."],

  "isRestrictedArea": true,
  "clearanceHeightMm": 2100,

  "equipmentType": "boom_truck | flatbed | flatbed_tow",
  "requiresGatePass": true,
  "isSpecialLoad": true,

  "dimensions": { "lengthCm": 950, "widthCm": 320, "heightCm": 310 },
  "weightKg": 18000,
  "loadingType": "crane | forklift | manual | ramp",
  "isFragile": false,
  "specialNotes": "Handle with care"
}
```

```json
Response 201:
{
  "status": "success",
  "data": {
    "jobId": "generated_id",
    "status": "assigned",
    "price": 29000,
    "priceDisplay": "QR 290.00",
    "assignedDriver": {
      "id": "driver_xyz",
      "name": "Mohammed",
      "truckType": "standard_tow",
      "rating": 4.8,
      "estimatedETA": {
        "etaMinutes": 8,
        "isPeakHour": false
      }
    }
  }
}
```

> **If no driver available:** `assignedDriver: null`, `status: "pending"`

#### Week 4 — New Job Fields Explained for UI

| Field | Type | UI Element | When Required |
|---|---|---|---|
| `pickupCoords` | `{lat, lng}` | Google Maps pin drop | All jobs (for geo-matching) |
| `isRestrictedArea` | bool | Toggle "Basement/Restricted?" | When pickup is underground/gated |
| `clearanceHeightMm` | int | Slider or dropdown (e.g. 2100mm, 2400mm) | When `isRestrictedArea=true` |
| `requiresGatePass` | bool | Toggle "Gate Pass Required?" | Industrial sites |
| `equipmentType` | string | Dropdown | Heavy equipment jobs |
| `isSpecialLoad` | bool | Auto-set when vehicleType is heavy | Heavy/industrial jobs |
| `customItem` | string | Text input | When vehicleType = "Others" |
| `customDetails` | string | Multi-line text | When vehicleType = "Others" |
| `dimensions` | object | 3-field form | Heavy equipment |
| `weightKg` | number | Number input | Heavy equipment |

---

### 🚛 Drivers

#### Register Driver
```
POST /api/drivers
```
```json
{
  "uid": "FIREBASE_UID",
  "name": "Mohammed Al-Rashidi",
  "email": "driver@example.com",
  "phone": "+97455599999",
  "truckType": "standard_tow",
  "maxCapacityKg": 3500,
  "licensePlate": "D 77712",
  "vehicleModel": "Toyota Land Cruiser Flatbed 2021",

  "vehicleHeightMm": 1950,
  "equipmentTypes": ["flatbed_tow"],
  "yearsExperience": 5,
  "hasGatePass": false,
  "isExpert": false,

  "licenseExpiry": "2026-12-31",
  "insuranceExpiry": "2026-09-30",
  "visaExpiry": "2027-03-15",
  "roadworthinessExpiry": "2026-11-01",

  "serviceTypes": ["tow", "garage"]
}
```

> **Week 4 new driver form fields:**
> - `vehicleHeightMm` — actual height of truck in mm. Used for basement clearance matching.
> - `equipmentTypes` — what the truck can do: boom_truck, flatbed, flatbed_tow
> - `yearsExperience` — integer, used for expert-first routing
> - `hasGatePass` — boolean toggle in form
> - `licenseExpiry` / `insuranceExpiry` / `visaExpiry` / `roadworthinessExpiry` — date pickers (ISO string YYYY-MM-DD)

#### Set Driver Online/Offline
```
PUT /api/drivers/status
{ "driverUid": "UID", "isOnline": true }
```
> Call this when driver taps the "Go Online" toggle in the driver app.

---

### 🔧 Garage Requests — Week 4 On-Site Repair

This is a completely new service type. Flow:

```
Customer creates request
    ↓
System broadcasts to nearby garages (Firestore: garage_live_requests)
    ↓
Garages submit estimates (price + ETA)
    ↓
Customer views estimates, accepts one
    ↓
Garage heads to customer → in_progress → completed
(OR: auto-cancelled after 15 minutes if no response)
```

#### Step 1 — Customer creates request
```
POST /api/garage-requests
```
```json
{
  "userId": "user_abc123",
  "location": { "lat": 25.2854, "lng": 51.5310 },
  "locationLabel": "Al Mirqab Street, near City Center Doha",
  "vehicleType": "sedan",
  "vehicleModel": "Honda Civic 2021",
  "vehiclePlate": "A 55432",
  "issue": "Car won't start. Battery suspected.",
  "urgency": "high",
  "photoUrls": []
}
```

#### Step 2 — Flutter: Listen for incoming estimates (Firestore real-time)
```dart
// Listen for updates on this garage request
FirebaseFirestore.instance
  .collection('garage_requests')
  .doc(requestId)
  .snapshots()
  .listen((snapshot) {
    final data = snapshot.data();
    final status = data?['status'];
    // When status changes to 'collecting_estimates' → show estimates tab
    // When status changes to 'accepted' → show assigned garage
  });
```

#### Step 3 — Garage submits estimate (from garage-side app)
```
POST /api/garage-requests/{id}/estimate
```
```json
{
  "garageId": "garage_xyz789",
  "garageName": "Al-Noor Auto Service",
  "price": 12000,
  "eta": 15,
  "notes": "Battery replacement + alternator test. Price includes parts."
}
```
> `price` = halala (12000 = QR 120.00)
> `eta` = minutes until arrival

#### Step 4 — Customer polls/views estimates
```
GET /api/garage-requests/{id}/estimates
```
```json
Response:
{
  "status": "success",
  "data": {
    "count": 3,
    "estimates": [
      {
        "id": "est_001",
        "garageId": "garage_xyz789",
        "garageName": "Al-Noor Auto Service",
        "price": 12000,
        "priceDisplay": "QR 120.00",
        "eta": 15,
        "rating": 4.7,
        "isBestPrice": true,
        "isFastestArrival": false,
        "submittedAt": "2026-04-26T10:30:00.000Z"
      },
      {
        "id": "est_002",
        "garageId": "garage_abc111",
        "garageName": "Quick Fix Garage",
        "price": 9500,
        "priceDisplay": "QR 95.00",
        "eta": 25,
        "rating": 4.2,
        "isBestPrice": false,
        "isFastestArrival": false
      }
    ]
  }
}
```

#### Step 5 — Customer accepts
```
PUT /api/garage-requests/{id}/accept
{ "estimateId": "est_001" }
```

#### Auto-cancel (call from Flutter after 15 minutes)
```
POST /api/garage-requests/{id}/auto-cancel
```
> Call this 15 minutes after creation if customer hasn't received/accepted any estimate.

---

### ⚠️ Discipline — Admin/System Only

> These endpoints are called by **system logic or admin panel**, not by the regular customer/driver app.

| Endpoint | When to call |
|---|---|
| `POST /api/discipline/driver-late` | Timer: driver hasn't arrived after expected ETA + 15min buffer |
| `POST /api/discipline/driver-noshow` | Timer: driver hasn't responded/arrived after 10-15min past job start |
| `POST /api/discipline/customer-noshow` | Timer: customer not at pickup location 10min after driver arrives |
| `PUT /api/discipline/{id}/unsuspend` | Admin dashboard action |
| `POST /api/discipline/compliance/{id}` | After driver updates a document |
| `POST /api/discipline/compliance-all` | Daily Cloud Scheduler job |

---

## Error Response Format

All errors follow this format:
```json
{
  "status": "error",
  "message": "Description of what went wrong",
  "errors": [
    { "field": "vehicleType", "message": "vehicleType is required" }
  ]
}
```

Common HTTP codes:
| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error (check `errors` array) |
| 404 | Resource not found |
| 500 | Server error (check Firebase logs) |

---

## Firestore Real-Time Listeners (Flutter)

For live job/request tracking, use Firestore directly instead of polling the API:

```dart
// Track job status in real-time
FirebaseFirestore.instance
  .collection('jobs')
  .doc(jobId)
  .snapshots()
  .listen((doc) {
    final status = doc['status'];
    final driverId = doc['driverId'];
    final eta = doc['estimatedETA'];
    // Update UI
  });

// Customer: Watch garage_requests for incoming estimates
FirebaseFirestore.instance
  .collection('garage_requests')
  .doc(requestId)
  .snapshots()
  .listen((doc) {
    final status = doc['status'];
    // When status == 'collecting_estimates' → show estimates button
    // When status == 'accepted' → show assigned garage details
    // When status == 'cancelled' → show cancellation screen
  });

// Garage: Listen to broadcast queue
FirebaseFirestore.instance
  .collection('garage_live_requests')
  .where('garageId', isEqualTo: currentGarageId)
  .orderBy('broadcastAt', descending: true)
  .snapshots()
  .listen((snapshot) {
    // Show incoming repair request notification
  });
```

---

## Week 4 UI Checklist for Flutter Dev

These are new screens/components needed in the Flutter app to support the Week 4 backend:

### Customer App
- [ ] **Basement/Restricted toggle** on job creation form
  - When ON: show clearance height selector (dropdown: 2000mm / 2100mm / 2200mm / 2400mm / Custom)
- [ ] **Gate pass toggle** — "Does this site require a gate pass?"
- [ ] **"Others" vehicle type flow** — text input for customItem + customDetails + photo upload
- [ ] **On-site repair flow** — new service type with location pin, issue description, photo upload
- [ ] **Estimates list screen** — show all garage bids, sorted by price, isBestPrice badge
- [ ] **Accept estimate** — tap to accept, confirm screen

### Driver App
- [ ] **Vehicle height field** in profile (`vehicleHeightMm`) — number input in mm
- [ ] **Equipment types** — multi-select checkboxes (boom_truck / flatbed / flatbed_tow)
- [ ] **Document expiry dates** — 4 date pickers in profile
- [ ] **Compliance warning banner** — show when any document is expiring within 30 days

### Admin / Ops
- [ ] **Discipline log viewer** — list `driver_discipline_log` collection
- [ ] **Unsuspend button** — calls `PUT /api/discipline/{id}/unsuspend`
- [ ] **Compliance dashboard** — shows complianceBlocked drivers

---

## Important Notes

1. **Halala everywhere** — Never display raw halala to users. Always call `toQAR(halala)`.
2. **Coords required for matching** — Always send `pickupCoords` with job creation. Without it, geo-matching (10km filter) cannot run.
3. **clearanceHeightMm is in millimeters** — 2100mm = 2.1 meters. Standard basement in Qatar: ~2100-2400mm.
4. **vehicleHeightMm is the truck's physical height** — drivers must measure their truck accurately. Mismatched heights = failed basement access.
5. **Garage request 15-min timer** — the frontend must call `/auto-cancel` after 15 minutes, or implement a Firebase Cloud Scheduler for this (recommended for production).
6. **estimateId** — when accepting an estimate, get the `id` from the estimates list response and pass it to the accept endpoint.

---

*RoadResQ Backend Team — Week 4 Integration Package*
