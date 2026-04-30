# RoadResQ API — Frontend Integration Guide v4.1.0

**Base URL (Production):** `https://api-h6acdw3itq-ww.a.run.app`  
**Firebase Project:** `roadresq-bd6b0` | **Region:** `me-central1` (Doha, Qatar)

---

## 📦 Postman Setup

1. Import **`RoadResQ_API_v4_Complete.postman_collection.json`** from this folder
2. Import the environment: **`RoadResQ_Production.postman_environment.json`**
3. Get a Firebase ID Token using the **🔑 Firebase Token Helper** folder in the collection
4. Set `{{idToken}}` and `{{userId}}` in your environment

---

## 🔐 Authentication

All auth uses **Firebase Authentication**. The backend uses **Firebase Admin SDK** to verify tokens.

### How it works
```
Flutter App                    Backend
-----------                    -------
Firebase.signIn(email, pw) --> gets idToken
POST /api/auth/login           verifies idToken with Firebase Admin
{ idToken }            -->     returns user profile from Firestore

All protected routes:
Authorization: Bearer <idToken>
```

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Create account (Firebase Auth + Firestore) |
| POST | `/api/auth/login` | None | Verify Firebase token, get profile |
| GET | `/api/auth/me` | 🔐 Bearer | Get own profile |
| GET | `/api/auth/user/:uid` | None | Get user by UID |

### Register
```json
POST /api/auth/register
{
  "name": "Ahmed Al-Rashidi",
  "email": "ahmed@example.com",
  "password": "Test@1234",
  "phone": "+974-5555-0001",
  "role": "customer"
}
```
`role`: `customer` | `driver` | `admin` | `garage`

### Login
```json
POST /api/auth/login
{ "idToken": "<Firebase ID Token from client SDK>" }
```

### Get Token for Postman Testing
```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<WEB_API_KEY>
{ "email": "...", "password": "...", "returnSecureToken": true }
```
Copy `idToken` from response → set as `{{idToken}}` in Postman environment.

---

## 🚗 Jobs

### Create Job (Immediate)
```json
POST /api/jobs
{
  "userId": "firebase_uid",
  "vehicleType": "Sedan",
  "pickup": "Al Dafna, Doha",
  "drop": "Al Sadd Service Center",
  "pickupCoords": { "lat": 25.3548, "lng": 51.1839 },
  "distanceKm": 8.5,
  "serviceType": "tow",
  "customerNotes": "Car won't start"
}
```

### Create Job (Scheduled) 📅
```json
POST /api/jobs
{
  "userId": "firebase_uid",
  "vehicleType": "Sedan",
  "pickup": "The Pearl, Doha",
  "drop": "Al Sadd Service Center",
  "pickupCoords": { "lat": 25.3713, "lng": 51.5509 },
  "isScheduled": true,
  "scheduledPickupDate": "2026-05-15",
  "scheduledPickupTime": "09:00",
  "customerNotes": "Please be on time"
}
```
- `scheduledPickupDate`: `YYYY-MM-DD`
- `scheduledPickupTime`: `HH:MM` (24h, Qatar time)
- No driver assigned immediately — response confirms booking

### Cancel Job
```json
DELETE /api/jobs/:id/cancel
{
  "cancellationReason": "customer_request",
  "cancelledBy": "customer"
}
```
`cancellationReason`: `customer_request` | `changed_mind` | `no_driver_available` | `driver_no_show`

### Job Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/jobs` | Create job |
| GET | `/api/jobs/my-jobs?userId=` | Customer's jobs |
| GET | `/api/jobs/available?truckType=` | Driver's job feed |
| GET | `/api/jobs/:id` | Job details |
| GET | `/api/jobs/:id/status` | Live status + driver ETA |
| GET | `/api/jobs/:id/match` | Matching drivers list |
| GET | `/api/jobs/service-info` | All vehicle types + pricing catalog |
| GET | `/api/jobs/price-estimate?vehicleType=Sedan&distanceKm=10` | Price in halala |
| PUT | `/api/jobs/:id/accept` | Driver accepts job |
| PUT | `/api/jobs/:id/status` | Update job status |
| PUT | `/api/jobs/:id/rate-driver` | Rate driver 1-5 |
| DELETE | `/api/jobs/:id/cancel` | Cancel job |

---

## 💰 Pricing

All prices are in **halala** (integer). Divide by 100 for QR display.
```
5000 halala = QR 50.00
15000 halala = QR 150.00
```

---

## 📋 Quotes (Industrial / Garage)

```json
POST /api/quotes
{
  "userId": "firebase_uid",
  "serviceType": "quote_industrial",
  "vehicleType": "20ft Container",
  "itemDescription": "Loaded shipping container",
  "pickup": "Hamad Port, Doha",
  "drop": "Al Khor Industrial Zone",
  "estimatedWeight": 12000,
  "urgency": "medium",
  "preferredDate": "2026-05-10",
  "preferredTime": "08:00"
}
```

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/quotes` | Submit quote request |
| GET | `/api/quotes/my-quotes?userId=` | Customer's quotes |
| GET | `/api/quotes/:id` | Quote details |
| PUT | `/api/quotes/:id/respond` | Garage responds with price |
| PUT | `/api/quotes/:id/accept` | Customer accepts |
| PUT | `/api/quotes/:id/reject` | Customer rejects |
| POST | `/api/quotes/:id/bid` | Driver submits bid |
| GET | `/api/quotes/:id/bids` | All bids (sorted best price) |
| PUT | `/api/quotes/:id/bids/:bidId/accept` | Customer accepts bid |

---

## 🔧 Garage (On-Site Repair)

```json
POST /api/garage-requests
{
  "userId": "firebase_uid",
  "issue": "Flat Tyre",
  "location": { "lat": 25.2854, "lng": 51.5310 },
  "additionalNotes": "Front left tyre",
  "isScheduled": false,
  "preferredDate": null,
  "preferredTime": null,
  "contactInfo": { "name": "Ahmed", "phone": "+974-5555-0001" }
}
```

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/garage-requests` | Create repair request (broadcasts to garages) |
| GET | `/api/garage-requests?userId=` | List requests |
| GET | `/api/garage-requests/:id` | Request details |
| POST | `/api/garage-requests/:id/estimate` | Garage submits price estimate |
| GET | `/api/garage-requests/:id/estimates` | All estimates |
| PUT | `/api/garage-requests/:id/accept` | Customer accepts estimate |
| PUT | `/api/garage-requests/:id/status` | Update status |

---

## 👤 Drivers

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/drivers` | Create driver profile (after register) |
| GET | `/api/drivers` | List drivers |
| GET | `/api/drivers/truck-types` | All truck type definitions |
| GET | `/api/drivers/:id` | Driver profile |
| GET | `/api/drivers/:id/status` | Driver status + compliance |
| PUT | `/api/drivers/:id/online` | Go online (start accepting jobs) |
| PUT | `/api/drivers/:id/offline` | Go offline |
| PUT | `/api/drivers/:id/approve` | Admin approves driver |

---

## 🛡️ Discipline & Safety

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/discipline/compliance/:driverId` | Document compliance status |
| POST | `/api/discipline/checklist/:jobId/driver` | Submit pre-trip checklist |
| POST | `/api/discipline/checklist/:jobId/customer` | Submit customer safety confirmation |
| POST | `/api/discipline/no-show/:jobId` | Report no-show (charges QR 50) |
| GET | `/api/discipline/queue` | Priority job queue |

---

## 📊 Job Status Flow

```
pending → assigned → accepted → in_progress → on_site → at_garage → completed
                                                                   ↘ cancelled
```

---

## ⚠️ Common Errors

| Code | Meaning |
|------|---------|
| 401 | Missing/invalid Firebase token |
| 403 | Wrong role for this endpoint |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already registered) |
| 422 | Validation error — check `errors` array in response |

---

## 🔗 Links

- **GitHub:** https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev/backend
- **API Folder:** https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev/api
- **Firebase Console:** https://console.firebase.google.com/project/roadresq-bd6b0
