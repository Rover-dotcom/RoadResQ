# RoadResQ API Documentation

> **Version:** 1.0.0 · **Backend:** Node.js + Express + Firebase Admin SDK · **Database:** Firestore

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
  "name": "Kent Reyes",
  "email": "kent@roadresq.com",
  "password": "password123",
  "phone": "+63 912 345 6789",
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
    "name": "Kent Reyes",
    "email": "kent@roadresq.com",
    "phone": "+63 912 345 6789",
    "role": "customer",
    "createdAt": "2025-01-01T00:00:00.000Z"
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
  "vehicleType": "Sedan",
  "pickup": "123 Rizal Ave, Manila",
  "drop": "AutoFix Garage, Quezon City",
  "distanceKm": 8,
  "description": "Optional notes"
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

**Category + Price auto-calculation:**

| vehicleType | Category | Price Formula |
|---|---|---|
| Sedan, SUV, 4x4, Motorcycle, ATV | `leisure` | `250 + (km × 5 × 1.0)` |
| Container, Generator, Precast Block, Pallets/Bricks | `heavy` | `250 + (km × 5 × 1.5)` |

**Examples:**
- Sedan, 8km → `250 + (8×5×1.0)` = **PHP 290**
- Container, 80km → `250 + (80×5×1.5)` = **PHP 850**

**Success (201):**
```json
{
  "status": "success",
  "data": {
    "id": "uuid-here",
    "userId": "...",
    "driverId": null,
    "serviceType": "tow",
    "vehicleType": "Sedan",
    "category": "leisure",
    "pickup": "123 Rizal Ave, Manila",
    "drop": "AutoFix Garage, Quezon City",
    "price": 290,
    "distanceKm": 8,
    "status": "pending",
    "createdAt": "2025-01-01T00:00:00.000Z"
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

**Example:** `GET /api/jobs/price-estimate?vehicleType=Container&distanceKm=20`
```json
{
  "status": "success",
  "data": {
    "vehicleType": "Container",
    "category": "heavy",
    "distanceKm": 20,
    "estimatedPrice": 400
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
  "name": "Juan Driver",
  "email": "driver@roadresq.com",
  "phone": "+63 917 000 0001",
  "vehicleType": "Sedan",
  "licenseNumber": "N01-23-456789",
  "experience": "3 years"
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
  "pickup": "Batangas Port",
  "drop": "PEZA Calamba"
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

## 💡 Pricing Logic

```
Base Price:      PHP 250
Per Km:          PHP 5
Heavy Multiplier: 1.5x

Leisure: price = 250 + (distanceKm × 5 × 1.0)
Heavy:   price = 250 + (distanceKm × 5 × 1.5)
```

**Vehicle type mapping:**
| Vehicle | Category | Multiplier |
|---|---|---|
| Sedan | leisure | 1.0x |
| SUV | leisure | 1.0x |
| 4x4 | leisure | 1.0x |
| Motorcycle | leisure | 1.0x |
| ATV | leisure | 1.0x |
| Precast Block | heavy | 1.5x |
| Pallets/Bricks | heavy | 1.5x |
| Container | heavy | 1.5x |
| Generator | heavy | 1.5x |

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
