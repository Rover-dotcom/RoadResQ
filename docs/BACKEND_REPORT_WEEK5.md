# RoadResQ Backend — Week 5 Report
**Version:** v5.0.0 | **Date:** 2026-05-01 | **Branch:** `backend-dev`
**Live API:** `https://api-h6acdw3itq-ww.a.run.app` ✅ DEPLOYED

---

## ✅ Week 5 — What's New

### 1. 🔐 Firebase Auth — Fixed & Complete
| Item | Status |
|------|--------|
| Email/Password Sign-In | ✅ Enabled |
| Google Sign-In | ✅ Enabled |
| `POST /api/auth/register` — creates Firebase Auth + Firestore user doc | ✅ Live |
| `POST /api/auth/login` — verifies Firebase ID token | ✅ Live |
| `GET /api/auth/me` — Bearer token, returns profile | ✅ Live (deployed) |
| `GET /api/auth/user/:uid` — user profile by UID | ✅ Live |
| `backend/middleware/auth.js` — `verifyToken` + `requireRole` | ✅ Live |

**How it works (Flutter integration):**
```
1. Flutter calls Firebase.signInWithEmailAndPassword(email, pw)
2. Firebase returns an idToken
3. Flutter sends: POST /api/auth/login { idToken }
4. Backend verifies with Firebase Admin SDK
5. All protected routes: Authorization: Bearer <idToken>
```

---

### 2. 🛡 Admin Safety Dashboard
**Base path:** `/api/incidents`

| Endpoint | Description |
|----------|-------------|
| `GET /api/incidents/live` | Live job feed: green/yellow/red color coding, open incident count, unread alerts |
| `GET /api/incidents/analytics` | Today's stats: jobs, completed, high-risk, incidents, driver online count |
| `GET /api/incidents/alerts` | Admin alert feed (panic, inactivity, fraud) |
| `POST /api/incidents` | Report incident (any signed-in user) |
| `GET /api/incidents` | List incidents (filter by status, type, riskLevel, jobId) |
| `GET /api/incidents/:id` | Incident detail + related job |
| `PUT /api/incidents/:id/action` | Admin action: `warn` / `suspend` / `ban` / `resolve` / `escalate` |
| `POST /api/incidents/panic` | 🚨 Panic button — flags job critical, creates alert + incident |
| `POST /api/incidents/inactivity-check` | Flags jobs with no activity for 15+ minutes |
| `PUT /api/incidents/alerts/:id/read` | Mark admin alert as read |

**Live Monitor Colors:**
- 🔴 Red = panic triggered or critical risk
- 🟡 Yellow = high risk or safety flags present
- 🟢 Green = safe, normal job

---

### 3. 🔍 Fraud Detection System
**Base path:** `/api/fraud`

**Fraud Score Engine:**
| Flag | Score Added |
|------|-------------|
| User cancel rate > 50% | +2 |
| Driver cancel rate > 50% | +2 |
| Price > 2x average | +3 |
| Location mismatch > 5km | +3 |
| Job completed < 3 min (ghost) | +2 |
| No photo on completion | +1 |
| Driver with 2+ warnings | +1 |

**Score Levels:** `0-2 = safe` | `3-5 = suspicious` | `6+ = high_risk 🚨`

| Endpoint | Description |
|----------|-------------|
| `GET /api/fraud/jobs` | All flagged high-risk jobs |
| `GET /api/fraud/users` | Top suspicious users (grouped by userId) |
| `GET /api/fraud/score/:jobId` | Fraud score for specific job |
| `POST /api/fraud/check` | Run fraud check + store result on job |
| `PUT /api/fraud/action` | Apply penalty: `warning` / `temporary_block` / `permanent_ban` |

---

### 4. ⚖️ Automated Dispute Resolution (ADR)
**Base path:** `/api/disputes`

**Decision Engine (auto-resolves at 80%+ confidence):**
| Case | Decision | Confidence |
|------|----------|------------|
| Service not completed + no photos | `refund_user` | 90% ✅ auto |
| Price > 1.5x estimate | `partial_refund` | 85% ✅ auto |
| Price > 2x estimate | `refund_user` | 85% ✅ auto |
| Driver no-show | `refund_user` | 88% ✅ auto |
| User no-show | `charge_user` | 80% ✅ auto |
| Delay | `partial_refund` | 70% → escalate |
| Damage / conflicting data | `escalate` | 60% → admin |

| Endpoint | Description |
|----------|-------------|
| `POST /api/disputes` | Submit dispute — auto-collects evidence from job, runs decision engine |
| `GET /api/disputes` | All disputes (filter by status, type, reportedBy) |
| `GET /api/disputes/:id` | Dispute detail |
| `GET /api/disputes/my/:userId` | User's own dispute history |
| `PUT /api/disputes/:id/resolve` | Admin approve or override decision |

---

### 5. 🦺 Safety System 2.0
**Base path:** `/api/safety`

**Risk Engine — Factors:**
| Factor | Score |
|--------|-------|
| Highway location | +3 |
| Industrial zone | +2 |
| Desert / remote | +2 |
| Night time (10pm–5am) | +2 |
| Peak hours (Qatar) | +1 |
| Basement | +1 |
| Heavy equipment service | +2 |

**Levels:** `0=low` | `1-3=medium` | `4-5=high` | `6+=critical`

| Endpoint | Description |
|----------|-------------|
| `POST /api/safety/risk-check` | Pre-job risk score + dynamic warning messages |
| `POST /api/safety/pin/generate` | Generate 4-digit PIN for job (hash stored, raw returned to customer) |
| `POST /api/safety/pin/verify` | Driver enters PIN at arrival → starts job |
| `POST /api/safety/confirm` | Customer confirms safety checklist |
| `POST /api/safety/feedback` | Post-job rating — auto-creates incident if unsafe |
| `GET /api/safety/job/:jobId` | Safety state of a job |

---

### 6. 📅 Scheduled Pickup (Week 4 Pending — Now Live)
```json
POST /api/jobs
{
  "isScheduled": true,
  "scheduledPickupDate": "2026-05-15",
  "scheduledPickupTime": "09:00"
}
```
Scheduled jobs skip auto-dispatch and confirm with pickup details.

---

## 🚀 Deployment Status

| Item | Status |
|------|--------|
| Cloud Functions v2 (me-central1) | ✅ DEPLOYED |
| Live API URL | `https://api-h6acdw3itq-ww.a.run.app` |
| Firestore rules | ✅ Deployed |
| GitHub branch `backend-dev` | ✅ Pushed (commit `5c92c54`) |
| Firebase Auth (Email + Google) | ✅ Enabled |

---

## 📦 Collections in Firestore
| Collection | Purpose |
|------------|---------|
| `users` | All user profiles (customer/driver/admin/garage) |
| `jobs` | All service jobs |
| `drivers` | Driver profiles + compliance |
| `quotes` | Industrial quote bids |
| `garage_requests` | On-site repair requests |
| `incidents` | Safety incidents (NEW) |
| `disputes` | ADR disputes (NEW) |
| `fraud_flags` | Fraud engine flags (NEW) |
| `admin_alerts` | Real-time admin alerts (NEW) |
| `safety_confirmations` | Pre-job confirmations (NEW) |
| `safety_feedback` | Post-job safety ratings (NEW) |
| `discipline_logs` | Driver discipline history |
| `compliance_alerts` | Document expiry alerts |
| `_schema` | Developer reference docs |

---

## 🛠 For Frontend Developer

### Auth Integration
```dart
// Flutter — Login
final userCredential = await FirebaseAuth.instance
  .signInWithEmailAndPassword(email: email, password: password);
final idToken = await userCredential.user!.getIdToken();

// Send to backend
final response = await http.post(
  Uri.parse('https://api-h6acdw3itq-ww.a.run.app/api/auth/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({'idToken': idToken}),
);
```

### Protected Request Header
```dart
Authorization: Bearer <idToken>
```

### Import Postman Collection
File: `api/RoadResQ_API_v4_Complete.postman_collection.json`
Environment: `docs/RoadResQ_Production.postman_environment.json`

---

## 📋 API Summary (All Endpoints — v5.0.0)

### Auth `/api/auth`
- `POST /register` — create account
- `POST /login` — verify Firebase token
- `GET /me` — get own profile (Bearer token)
- `GET /user/:uid` — get user by UID

### Jobs `/api/jobs`
- `POST /` — create job (supports isScheduled, scheduledPickupDate)
- `GET /my-jobs` — customer job feed
- `GET /available` — driver available jobs
- `GET /price-estimate` — price before booking
- `GET /service-info` — service catalog
- `GET /:id` — job detail
- `GET /:id/status` — live status
- `PUT /:id/status` — update status
- `POST /:id/accept` — driver accepts
- `DELETE /:id/cancel` — cancel + reason
- `POST /:id/rate` — rate driver

### Drivers `/api/drivers`
- `POST /` — register driver
- `GET /` — list drivers
- `GET /truck-types` — truck catalog
- `GET /:id` — driver profile
- `PUT /:id/status` — update status (admin)
- `POST /:id/online` / `/:id/offline` — toggle

### Safety Dashboard `/api/incidents`
- `GET /live` — live monitor feed
- `GET /analytics` — safety metrics
- `GET /alerts` — admin alerts
- `POST /` — report incident
- `GET /?status=open&riskLevel=high` — filtered list
- `GET /:id` — incident detail
- `PUT /:id/action` — admin action
- `POST /panic` — panic button
- `POST /inactivity-check` — flag inactive jobs
- `PUT /alerts/:id/read` — mark read

### Fraud `/api/fraud`
- `GET /jobs` — flagged jobs
- `GET /users` — suspicious users
- `GET /score/:jobId` — fraud score
- `POST /check` — run check
- `PUT /action` — apply penalty

### Disputes `/api/disputes`
- `POST /` — submit dispute (auto ADR)
- `GET /` — all disputes
- `GET /my/:userId` — own disputes
- `GET /:id` — detail
- `PUT /:id/resolve` — admin resolve

### Safety 2.0 `/api/safety`
- `POST /risk-check` — pre-job risk
- `POST /pin/generate` — get job PIN
- `POST /pin/verify` — verify PIN
- `POST /confirm` — safety checklist
- `POST /feedback` — post-job rating
- `GET /job/:jobId` — safety state

### Quotes, Garage, Discipline
(Unchanged from Week 4 — see previous report)
