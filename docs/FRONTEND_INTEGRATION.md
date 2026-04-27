# RoadResQ — Frontend Integration Guide (v3.0.0 / Week 4)

> **For:** Flutter Developer  
> **Backend Developer:** Cedric (blackburnxprojects@gmail.com)  
> **Last Updated:** April 2026  
> **Currency:** Qatar Riyal (QAR) — all prices in integer halala (5000 = QR 50.00)

---

## 🌐 Live API Base URL

```
https://api-h6acdw3itq-ww.a.run.app
```

**Region:** me-central1 — Doha, Qatar 🇶🇦  
**Project:** `roadresq-bd6b0`  
**Firebase Console:** https://console.firebase.google.com/project/roadresq-bd6b0/overview

> ⚠️ Use this URL for ALL API calls. Do NOT use localhost in production builds.

---

## 📦 Postman Files (in `/docs/` on GitHub)

| File | Purpose |
|---|---|
| `RoadResQ_API.postman_collection.json` | All 25+ endpoints with example bodies |
| `RoadResQ_Production.postman_environment.json` | **Production** environment (live URL) |
| `RoadResQ_Local.postman_environment.json` | Local dev environment (`localhost:3000`) |

### How to Import in Postman
1. Open Postman → **Import**
2. Import `RoadResQ_API.postman_collection.json`
3. Import `RoadResQ_Production.postman_environment.json`
4. Select environment **"RoadResQ — PRODUCTION (Deployed)"** from the top-right dropdown
5. All requests will automatically use the live URL

---

## 🔑 Firebase SDK Config (Flutter)

Your `google-services.json` is already in the repo root. Use these values in Flutter:

```dart
// lib/firebase_options.dart (or use FlutterFire CLI to generate)
const firebaseOptions = FirebaseOptions(
  apiKey: "AIzaSyDjQ94IKsHIYN5_yJQBtSaXgGYMCxXIVEw",
  appId: "1:990529227465:android:218d6e3414b7b8de431b18",
  messagingSenderId: "990529227465",
  projectId: "roadresq-bd6b0",
  storageBucket: "roadresq-bd6b0.firebasestorage.app",
);
```

### Flutter pubspec.yaml dependencies
```yaml
dependencies:
  firebase_core: ^3.0.0
  firebase_auth: ^5.0.0
  http: ^1.2.0        # for REST API calls
  # OR
  dio: ^5.4.0         # better for interceptors / auth headers
```

---

## 🔐 Authentication Flow

### Step 1 — Register User
```
POST https://api-h6acdw3itq-ww.a.run.app/api/auth/register
```
```json
{
  "email": "customer@example.com",
  "password": "password123",
  "name": "Ahmed Al-Mansoori",
  "phone": "+97455512345",
  "role": "customer"
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "uid": "abc123xyz",
    "email": "customer@example.com",
    "role": "customer",
    "token": "<Firebase ID Token>"
  }
}
```

### Step 2 — Login
```
POST https://api-h6acdw3itq-ww.a.run.app/api/auth/login
```
```json
{
  "idToken": "<Firebase ID Token from firebase_auth>"
}
```

### Step 3 — Use Token in All Requests
```
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json
```

> 💡 In Flutter: After `FirebaseAuth.instance.signInWithEmailAndPassword()`, call `user.getIdToken()` to get the token. Pass it as the `Authorization` header.

---

## 🚗 Service Structure (What to Show in Booking Screen)

```
GET https://api-h6acdw3itq-ww.a.run.app/api/jobs/service-info
```

Returns the full service catalog. Use this to populate dropdown menus.

### Service Categories & Vehicle Types

| Category | `serviceType` value | Vehicle Options |
|---|---|---|
| **Tow Service** | `tow` | `Sedan`, `SUV`, `4x4`, `Motorcycle`, `ATV`, `Tow Others` |
| **Garage / Repair** | `garage` | urgency: `urgent` or `standard` |
| **Heavy Equipment** | `heavy_equipment` | `Skid Loader`, `Telehandler`, `JCB`, `Excavator`, `Heavy Others` |
| **Quote (Industrial)** | `quote_industrial` | `Precast Block`, `Pallets`, `Container`, `Generator`, `Industrial Others` |

---

## 💰 Price Estimate (Before Booking)

```
GET https://api-h6acdw3itq-ww.a.run.app/api/jobs/price-estimate?vehicleType=Sedan&distanceKm=10
```

**Response (auto-priced):**
```json
{
  "status": "success",
  "data": {
    "requiresQuote": false,
    "vehicleType": "sedan",
    "serviceType": "tow",
    "price": 30000,
    "priceDisplay": "QR 300.00",
    "currency": "QAR",
    "breakdown": {
      "label": "Sedan Tow",
      "baseFare": 25000,
      "baseFareDisplay": "QR 250.00",
      "distanceKm": 10,
      "perKm": 500,
      "perKmDisplay": "QR 5.00",
      "distanceCharge": 5000,
      "distanceChargeDisplay": "QR 50.00",
      "total": 30000,
      "totalDisplay": "QR 300.00"
    }
  }
}
```

> ⚠️ **All prices are integers in halala.** Divide by 100 for display: `30000 halala = QR 300.00`

**Response (quote required):**
```json
{
  "status": "success",
  "data": {
    "requiresQuote": true,
    "reason": "This item type requires a custom quote from our team."
  }
}
```

### Pricing Reference Table (Qatar Riyal)

| Vehicle | Base Fare | Per KM | Halala (base) |
|---|---|---|---|
| Motorcycle | QR 150 | QR 3/km | 15000 |
| ATV | QR 180 | QR 4/km | 18000 |
| Sedan | QR 250 | QR 5/km | 25000 |
| SUV | QR 300 | QR 6/km | 30000 |
| 4x4 | QR 380 | QR 8/km | 38000 |
| Skid Loader | QR 800 | QR 12/km | 80000 |
| Telehandler | QR 1,200 | QR 16/km | 120000 |
| JCB | QR 1,500 | QR 18/km | 150000 |
| Excavator | QR 2,000 | QR 22/km | 200000 |
| Garage Urgent | QR 300 | QR 5/km | 30000 |
| No-Show Penalty | QR 50 (flat) | — | 5000 |

---

## 📋 All API Endpoints

### AUTH
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user or driver |
| `POST` | `/api/auth/login` | Verify Firebase ID token |

### JOBS
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/jobs` | Create a new job |
| `GET` | `/api/jobs` | Get all jobs (admin) |
| `GET` | `/api/jobs?userId=<id>` | Get customer's jobs |
| `GET` | `/api/jobs?driverId=<id>` | Get driver's jobs |
| `GET` | `/api/jobs?status=pending` | Filter by status |
| `GET` | `/api/jobs/available` | Pending jobs for driver to pick up |
| `GET` | `/api/jobs/available?truckType=standard_tow` | Filtered by truck type |
| `GET` | `/api/jobs/price-estimate?vehicleType=Sedan&distanceKm=10` | Price estimate |
| `GET` | `/api/jobs/service-info` | Full service catalog |
| `GET` | `/api/jobs/:id` | Single job details |
| `GET` | `/api/jobs/:id/match` | List matching drivers for job |
| `PUT` | `/api/jobs/:id/accept` | Driver accepts a job |
| `PUT` | `/api/jobs/:id/status` | Update job status |
| `PUT` | `/api/jobs/:id/rate-driver` | Rate driver (1–5) after completion |
| `DELETE` | `/api/jobs/:id/cancel` | Cancel a job |

### DRIVERS
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/drivers` | Create driver profile |
| `GET` | `/api/drivers` | All drivers (admin) |
| `GET` | `/api/drivers?isOnline=true` | Online drivers |
| `GET` | `/api/drivers/truck-types` | All truck types with labels |
| `GET` | `/api/drivers/:id` | Single driver profile |
| `PUT` | `/api/drivers/status` | Go online / offline |
| `PUT` | `/api/drivers/:id/approve` | Admin approves driver |
| `PUT` | `/api/drivers/:id` | Update driver profile |

### QUOTES
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/quotes` | Submit quote request |
| `GET` | `/api/quotes` | All quotes (admin) |
| `GET` | `/api/quotes?userId=<id>` | Customer's quotes |
| `GET` | `/api/quotes/:id` | Single quote |
| `PUT` | `/api/quotes/:id/respond` | Admin sets price |
| `PUT` | `/api/quotes/:id/accept` | Customer accepts quote |
| `PUT` | `/api/quotes/:id/reject` | Customer rejects quote |

---

## 🔄 Job Status Lifecycle

```
Customer Creates Job
        │
        ▼
    [pending] ──────────────► [quote_pending]  ← quote jobs
        │                           │
        │ (auto-assign or           │ Admin responds
        │  driver self-assign)      ▼
        ▼                      [quoted]
   [assigned]                      │
        │                   Customer accepts
        │ Driver accepts            ▼
        ▼                     [accepted_by_customer]
   [accepted]                      │
        │                          │ Auto-assign driver
        ▼                          ▼
  [in_progress]             [assigned] → [accepted] → [in_progress]
        │
        ▼
  [completed] or [cancelled]
```

### Status Values (use these strings in Flutter)
```dart
const jobStatuses = [
  'pending',
  'quote_pending',
  'quoted',
  'accepted_by_customer',
  'assigned',
  'accepted',
  'in_progress',
  'at_garage',
  'on_site',
  'completed',
  'cancelled',
];
```

---

## 📱 Flutter Code Examples

### Create a Job (Tow Service)
```dart
Future<Map> createJob({
  required String userId,
  required String vehicleType,  // e.g. "Sedan"
  required String pickup,
  required String drop,
  required double distanceKm,
}) async {
  final token = await FirebaseAuth.instance.currentUser!.getIdToken();
  final response = await http.post(
    Uri.parse('https://api-h6acdw3itq-ww.a.run.app/api/jobs'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'userId': userId,
      'vehicleType': vehicleType,
      'pickup': pickup,
      'drop': drop,
      'distanceKm': distanceKm,
    }),
  );
  return jsonDecode(response.body);
}
```

### Get Price Estimate
```dart
Future<Map> getPriceEstimate(String vehicleType, double distanceKm) async {
  final response = await http.get(
    Uri.parse(
      'https://api-h6acdw3itq-ww.a.run.app/api/jobs/price-estimate'
      '?vehicleType=$vehicleType&distanceKm=$distanceKm'
    ),
  );
  return jsonDecode(response.body);
}
```

### Driver — Go Online
```dart
Future<void> setDriverOnline(String driverUid, bool isOnline) async {
  final token = await FirebaseAuth.instance.currentUser!.getIdToken();
  await http.put(
    Uri.parse('https://api-h6acdw3itq-ww.a.run.app/api/drivers/status'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'driverUid': driverUid,
      'isOnline': isOnline,
    }),
  );
}
```

### Driver — Accept Job
```dart
Future<void> acceptJob(String jobId, String driverId) async {
  final token = await FirebaseAuth.instance.currentUser!.getIdToken();
  await http.put(
    Uri.parse('https://api-h6acdw3itq-ww.a.run.app/api/jobs/$jobId/accept'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({'driverId': driverId}),
  );
}
```

---

## 🛻 Driver Registration Fields

When a driver registers, they must provide:

```json
{
  "uid": "<Firebase UID>",
  "name": "Mohammed Al-Rashidi",
  "email": "driver@example.com",
  "phone": "+97455599999",
  "truckType": "standard_tow",
  "vehicleModel": "Toyota Land Cruiser Flatbed 2021",
  "licensePlate": "D 77712",
  "maxCapacityKg": 3500,
  "serviceTypes": ["tow"],
  "vehicleHeightMm": 1950,
  "equipmentTypes": ["flatbed_tow"],
  "yearsExperience": 5,
  "hasGatePass": false,
  "licenseExpiry": "2026-12-31",
  "insuranceExpiry": "2026-09-30",
  "visaExpiry": "2027-03-15",
  "roadworthinessExpiry": "2026-11-01"
}
```

### Truck Types (dropdown values)
| `truckType` value | Label |
|---|---|
| `light_tow` | Light Tow — Motorcycles, ATVs (up to 500kg) |
| `standard_tow` | Standard Tow — Sedans, SUVs (up to 2,500kg) |
| `heavy_tow` | Heavy Tow — 4x4, Pickups (up to 4,000kg) |
| `flatbed_small` | Small Flatbed — Skid Loaders (up to 5,000kg) |
| `flatbed_heavy` | Heavy Flatbed — JCB, Excavators (up to 15,000kg) |
| `service_van` | Service Van — Garage/Repair |

> API: `GET /api/drivers/truck-types` returns this full list dynamically.

---

## 📬 Submit a Quote Request

For `Garage Standard`, `Heavy Others`, all `Quote Industrial` types:

```
POST https://api-h6acdw3itq-ww.a.run.app/api/quotes
```
```json
{
  "userId": "abc123",
  "serviceType": "quote_industrial",
  "itemDescription": "20ft shipping container, needs crane offload",
  "pickup": "Hamad Port, Umm Al-Houl, Doha",
  "drop": "Mesaieed Industrial City",
  "estimatedWeight": 25000,
  "urgency": "medium",
  "customerNotes": "Available weekdays only"
}
```

---

## 🗄️ GitHub Repository

**Branch:** `backend-dev`  
**URL:** https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev

| Path | Contents |
|---|---|
| `backend/` | Full Node.js/Express source (local dev) |
| `functions/` | Firebase Cloud Functions source (deployed) |
| `docs/API_DOCUMENTATION.md` | Full API reference |
| `docs/RoadResQ_API.postman_collection.json` | Postman collection |
| `docs/RoadResQ_Production.postman_environment.json` | **Production** Postman env |
| `docs/RoadResQ_Local.postman_environment.json` | Local Postman env |
| `firestore.rules` | Firestore security rules |
| `firestore.indexes.json` | Firestore indexes |
| `firebase.json` | Firebase project config |
| `google-services.json` | Android Firebase config |

---

## ✅ Quick Test Checklist (Postman)

Run these in order using the Production environment:

1. `GET /` → Should return `{ status: "running" }`
2. `GET /api/jobs/service-info` → Returns all service types
3. `GET /api/jobs/price-estimate?vehicleType=sedan&distanceKm=10` → Returns `30000 halala (QR 300.00)`
4. `POST /api/auth/register` → Create a test customer
5. `POST /api/auth/register` (role: driver) → Create a test driver
6. `POST /api/drivers` → Create driver profile with `truckType: "standard_tow"`
7. `PUT /api/drivers/:id/approve` → Admin approves driver
8. `PUT /api/drivers/status` → Driver goes online
9. `POST /api/jobs` → Customer creates Sedan tow job
10. `GET /api/jobs/available` → Driver sees the job
11. `PUT /api/jobs/:id/accept` → Driver accepts
12. `PUT /api/jobs/:id/status` `{ status: "in_progress" }` → Job started
13. `PUT /api/jobs/:id/status` `{ status: "completed" }` → Job done
14. `PUT /api/jobs/:id/rate-driver` `{ rating: 5 }` → Customer rates driver
