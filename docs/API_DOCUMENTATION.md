# RoadResQ API Documentation

> **Version:** 3.0.0 · **Backend:** Node.js + Express + Firebase Admin SDK · **Database:** Firestore  
> **Currency:** Qatar Riyal (QAR) — all prices stored as integers in halala (5000 = QR 50.00)

---

## 🚀 Quick Start (Postman)

1. **Start the backend server:**
   ```bash
   cd backend
   npm install
   node server.js
   # Server running at http://localhost:3000
   ```

2. **Import into Postman:**
   - Open Postman → **Import**
   - Import **both** files from the `docs/` folder:
     - `RoadResQ_API.postman_collection.json` → the full collection
     - `RoadResQ_Local.postman_environment.json` → environment variables

3. **Select environment:**
   - Top-right dropdown in Postman → select **"RoadResQ Local"**

4. **Run the Full Flow Test** (folder in collection):
   - Run Steps 1–9 in order — they auto-save IDs to your environment ✅

---

## 🔑 Firebase Setup (Backend)

The backend uses Firebase Admin SDK. Place your service account key at:
```
backend/config/serviceAccountKey.json
```
Download it from: **Firebase Console → Project Settings → Service Accounts → Generate new private key**

Or use environment variables in `backend/.env` (see `.env.example`).

---

## 📋 Standard Response Format

All responses follow this format:

**Success:**
```json
{
  "status": "success",
  "data": { ... }
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Human-readable error message"
}
```

**Validation Error:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Valid email is required" }
  ]
}
```

---

## 🔐 Auth Endpoints

### `POST /api/auth/register`
Creates a new Firebase Auth account + Firestore user document.

**Body:**
```json
{
  "name": "Ahmed Al-Mansoori",
  "email": "ahmed@roadresq.com",
  "password": "password123",
  "phone": "+974 55 512 345",
  "role": "customer"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | Full name |
| `email` | string | ✅ | Valid email address |
| `password` | string | ✅ | Minimum 6 characters |
| `phone` | string | ✅ | Phone number |
| `role` | string | ❌ | `customer` (default) \| `driver` \| `garage` \| `admin` |

**Success (201):**
```json
{
  "status": "success",
  "data": {
    "uid": "firebase-uid-here",
    "name": "Ahmed Al-Mansoori",
    "email": "ahmed@roadresq.com",
    "phone": "+974 55 512 345",
    "role": "customer",
    "createdAt": "2026-04-26T00:00:00.000Z"
  }
}
```

**Errors:**
| Code | Reason |
|---|---|
| 400 | Missing or invalid fields |
| 409 | Email already registered |

---

### `POST /api/auth/login`
Verifies a Firebase ID Token and returns the user profile.

> **Note:** The Firebase ID Token is obtained client-side (Flutter) after the user signs in via Firebase Auth SDK.

**Body:**
```json
{
  "idToken": "eyJhbGci..."
}
```

**Getting the `idToken` for testing:**
```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_WEB_API_KEY
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword",
  "returnSecureToken": true
}
```
Copy the `idToken` from the response into the Postman environment variable `firebaseIdToken`.

**Success (200):**
```json
{
  "status": "success",
  "data": {
    "uid": "firebase-uid",
    "name": "Kent Reyes",
    "email": "kent@roadresq.com",
    "role": "customer"
  }
}
```

---

## 💼 Job Endpoints

### `POST /api/jobs`
Creates a new job. **Auto-detects category and calculates price.**

**Body:**
```json
{
  "userId": "firebase-uid",
  "serviceType": "tow",
  "vehicleType": "sedan",
  "pickup": "West Bay, Doha",
  "drop": "The Pearl, Doha",
  "distanceKm": 8,
  "pickupCoords": { "lat": 25.3388, "lng": 51.5074 },
  "customerNotes": "Optional notes"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `userId` | string | ✅ | Firebase UID of the customer |
| `serviceType` | string | ✅ | `tow` \| `repair` \| `heavy` \| `quote` |
| `vehicleType` | string | ✅ | See vehicle types below |
| `pickup` | string | ✅ | Pickup location |
| `drop` | string | ✅ | Destination |
| `distanceKm` | number | ❌ | Defaults to 5km if not provided |
| `description` | string | ❌ | Optional job notes |
| `repairOption` | string | ❌ | `garage` \| `on_site` |
| `garageId` | string | ❌ | Firestore garage document ID |

**Category + Price calculation (halala integers):**

| vehicleType | Base Fare | Per Km |
|---|---|---|
| sedan | QR 250.00 (25000 hl) | QR 5.00 (500 hl) |
| suv | QR 300.00 (30000 hl) | QR 6.00 (600 hl) |
| 4x4 | QR 380.00 (38000 hl) | QR 8.00 (800 hl) |
| excavator | QR 2,000.00 (200000 hl) | QR 22.00 (2200 hl) |

**Examples (halala):**
- sedan, 8km → `25000 + (8 × 500)` = **29000 halala (QR 290.00)**
- excavator, 35km → `200000 + (35 × 2200)` = **277000 halala (QR 2,770.00)**

**Success (201):**
```json
{
  "status": "success",
  "data": {
    "id": "uuid-here",
    "userId": "...",
    "driverId": null,
    "serviceType": "tow",
    "vehicleType": "sedan",
    "pickup": "West Bay, Doha",
    "drop": "The Pearl, Doha",
    "price": 29000,
    "priceDisplay": "QR 290.00",
    "currency": "QAR",
    "distanceKm": 8,
    "status": "pending",
    "createdAt": "2026-04-26T00:00:00.000Z"
  }
}
```

---

### `GET /api/jobs`
Returns all jobs. Supports query parameters for filtering.

| Query Param | Description |
|---|---|
| _(none)_ | Returns all jobs (admin use) |
| `?userId=<uid>` | Customer's job history |
| `?driverId=<uid>` | Driver's job history |

---

### `GET /api/jobs/available`
Returns pending jobs matching the driver's vehicle type.

| Query Param | Description |
|---|---|
| `?vehicleType=Sedan` | Filter to jobs matching this vehicle type |

**Driver matching logic:**
```
Driver.find({ isOnline: true, isApproved: true, vehicleType: job.vehicleType })
```

---

### `GET /api/jobs/price-estimate`
Calculate price before creating a job.

| Query Param | Example |
|---|---|
| `vehicleType` | `Sedan` |
| `distanceKm` | `10` |

**Example:** `GET /api/jobs/price-estimate?vehicleType=sedan&distanceKm=10`
```json
{
  "status": "success",
  "data": {
    "vehicleType": "sedan",
    "serviceType": "tow",
    "distanceKm": 10,
    "price": 30000,
    "priceDisplay": "QR 300.00",
    "currency": "QAR"
  }
}
```

---

### `GET /api/jobs/:id`
Returns a single job by ID.

---

### `PUT /api/jobs/:id/accept`
Driver accepts a pending job.

**Body:**
```json
{ "driverId": "driver-firebase-uid" }
```

**Errors:**
| Code | Reason |
|---|---|
| 404 | Job not found |
| 409 | Job already accepted (not pending) |

---

### `PUT /api/jobs/:id/status`
Update job status.

**Body:**
```json
{ "status": "in_progress" }
```

**Valid statuses (in order):**
```
pending → accepted → in_progress → at_garage → completed
                                             └→ cancelled
```

---

## 🚗 Driver Endpoints

### `POST /api/drivers`
Create a driver profile (run AFTER `/api/auth/register` with role=driver).

**Body:**
```json
{
  "uid": "driver-firebase-uid",
  "name": "Mohammed Al-Rashidi",
  "email": "driver@roadresq.com",
  "phone": "+974 55 599 999",
  "truckType": "standard_tow",
  "vehicleModel": "Toyota Land Cruiser Flatbed 2021",
  "maxCapacityKg": 3500,
  "vehicleHeightMm": 1950,
  "yearsExperience": 5
}
```

> New drivers are created with `isApproved: false` and `isOnline: false`.
> Admin must approve before they can receive jobs.

---

### `GET /api/drivers`
Returns all drivers.

| Query Param | Description |
|---|---|
| _(none)_ | All drivers (admin) |
| `?vehicleType=Sedan` | Approved + online drivers with this vehicle type |

---

### `GET /api/drivers/:id`
Returns a single driver by Firebase UID.

---

### `PUT /api/drivers/status`
Set driver online/offline status.

**Body:**
```json
{
  "driverUid": "firebase-uid",
  "isOnline": true,
  "location": { "lat": 14.5995, "lng": 120.9842 }
}
```

> `location` is optional — used for GPS tracking.

---

### `PUT /api/drivers/:id/approve`
Admin approves or revokes a driver.

**Body:**
```json
{ "approve": true }
```

---

## 📋 Quote Request Endpoints

### `POST /api/quotes`
Customer submits a quote request for special/heavy loads.

**Body:**
```json
{
  "userId": "firebase-uid",
  "itemType": "Generator",
  "description": "1000KVA industrial generator",
  "pickup": "Hamad Port, Doha",
  "drop": "Mesaieed Industrial City"
}
```

---

### `GET /api/quotes`
All quotes (admin). Add `?userId=<uid>` for customer-specific quotes.

---

### `PUT /api/quotes/:id/respond`
Admin responds with a price.

**Body:**
```json
{ "quotedPrice": 5500 }
```

---

## 💡 Pricing Logic (Qatar Riyal / Halala)

```
All amounts stored as INTEGER HALALA (divide by 100 for QAR display)

Examples:
  Sedan,   10km: 25000 + (10 × 500)  = 30000 halala = QR 300.00
  SUV,     15km: 30000 + (15 × 600)  = 39000 halala = QR 390.00
  4x4,     20km: 38000 + (20 × 800)  = 54000 halala = QR 540.00
  Excavator 35km: 200000 + (35 × 2200) = 277000 halala = QR 2,770.00
  No-show penalty (flat): 5000 halala = QR 50.00
```

**Full pricing table:**
| Vehicle | Base (halala) | Base (QAR) | Per km (halala) |
|---|---|---|---|
| Motorcycle | 15000 | QR 150 | 300 |
| ATV | 18000 | QR 180 | 400 |
| Sedan | 25000 | QR 250 | 500 |
| SUV | 30000 | QR 300 | 600 |
| 4x4 | 38000 | QR 380 | 800 |
| Skid Loader | 80000 | QR 800 | 1200 |
| Telehandler | 120000 | QR 1,200 | 1600 |
| JCB | 150000 | QR 1,500 | 1800 |
| Excavator | 200000 | QR 2,000 | 2200 |
| Garage Urgent | 30000 | QR 300 | 500 |

---

## 🧱 Complete Folder Structure

```
backend/
├── server.js                    # Express entry point (port 3000)
├── package.json
├── .env.example                 # Copy to .env and fill in credentials
├── README.md
├── config/
│   └── firebase.js              # Firebase Admin SDK init
├── controllers/
│   ├── authController.js        # Register + Login logic
│   ├── jobController.js         # All job CRUD + filtering
│   ├── driverController.js      # Driver profile + status
│   └── quoteController.js       # Quote request flow
├── routes/
│   ├── authRoutes.js            # /api/auth/*
│   ├── jobRoutes.js             # /api/jobs/*
│   ├── driverRoutes.js          # /api/drivers/*
│   └── quoteRoutes.js           # /api/quotes/*
├── models/
│   ├── userModel.js             # Firestore: users collection
│   ├── driverModel.js           # Firestore: drivers collection
│   └── jobModel.js              # Firestore: jobs collection
└── utils/
    └── categoryEngine.js        # getCategory() + calculatePrice()
```

---

## 🛠 Error Reference

| HTTP Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad request / validation error |
| 401 | Invalid or expired auth token |
| 404 | Resource not found |
| 409 | Conflict (e.g., email taken, job already accepted) |
| 500 | Server error |
