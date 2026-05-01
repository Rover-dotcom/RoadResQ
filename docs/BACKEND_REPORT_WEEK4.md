# RoadResQ — Week 4 Backend Report (+ Bonus Tasks)
**Version:** v5.0.0 | **Deployed:** Firebase Cloud Functions | **Region:** me-central1 (Doha, Qatar)
**Date Completed:** 2026-05-01 | Firebase: Deployed | GitHub: Pushed | Postman: Updated

---

## Live Links

| Resource | URL |
|---|---|
| **Live API** | https://api-h6acdw3itq-ww.a.run.app |
| **Health Check** | https://api-h6acdw3itq-ww.a.run.app/ |
| **Firebase Console** | https://console.firebase.google.com/project/roadresq-bd6b0/overview |
| **GitHub Branch** | https://github.com/Rover-dotcom/RoadResQ/tree/backend-dev |
| **Postman Collection** | `/api/RoadResQ_API_v4_Complete.postman_collection.json` |
| **API Docs** | `/api/README.md` |

---

## Completion Checklist

| Task | Status |
|---|---|
| 4 services: Tow, Garage, Heavy Equipment, Industrial Quote | Done |
| "Others" dynamic input on all service types | Done |
| Smart dispatch: 10km radius, equipment type, height, gate pass | Done |
| Quote bidding system (multi-driver bids, best price highlighted) | Done |
| On-site repair broadcast -> estimate -> customer accept | Done |
| Driver discipline: 3-strike auto-suspend, no-show fee QR 50 | Done |
| Document compliance: 30-day notify, 7-day critical, expired = blocked | Done |
| Job priority queue + admin review queue | Done |
| All pricing in QAR halala integers | Done |
| Scheduled pickup date & time on all job types | Done |
| Cancellation tracking (reason + who cancelled) | Done |
| **Firebase Auth: Email/Password + Google Sign-In** | Done |
| **Firebase token-based login (Bearer token auth)** | Done |
| **Admin Safety Dashboard** | BONUS |
| **Fraud Detection System** | BONUS |
| **Automated Dispute Resolution (ADR)** | BONUS |
| **Safety System 2.0 (Risk + PIN + Panic)** | BONUS |
| Postman collection v4.1.0 (all endpoints + auth helper) | Done |
| Firestore security rules deployed | Done |
| Firebase deployed and live | Done |
| GitHub pushed | Done |

---

## Key Highlights

- Login uses Firebase tokens, not passwords (`backend/controllers/authController.js`)
- Scheduled pickup is supported on all job types (`backend/controllers/jobController.js`)
- Smart matching filters automatically (`backend/utils/matchingEngine.js`)
- Quotes and on-site repair use different flows (`backend/controllers/quoteController.js`, `backend/controllers/garageController.js`)
- Driver discipline runs automatically (`backend/utils/disciplineEngine.js`)
- The live safety monitor shows every active job in color (`backend/controllers/incidentController.js`)
- Fraud score is calculated automatically on every job (`backend/utils/fraudEngine.js`)
- Disputes resolve themselves in seconds for clear cases (`backend/controllers/disputeController.js`)
- Driver verifies arrival with a PIN (`backend/utils/safetyEngine.js`)
- Panic button creates an instant admin alert (`backend/controllers/incidentController.js`)

---

## File Structure

### Core Engines (`backend/utils/`)
| File | What It Does |
|---|---|
| `matchingEngine.js` | Filters eligible drivers by distance, equipment, height, gate pass, documents |
| `pricingEngine.js` | Calculates price in halala integers with distance tiers and peak-hour buffer |
| `serviceEngine.js` | `deriveJobConstraints()` — single source of truth for all job constraints |
| `categoryEngine.js` | Maps vehicle type -> service category (tow / heavy / garage / quote) |
| `disciplineEngine.js` | No-show fee, late warnings, auto-suspend, document expiry check, priority queue |
| `fraudEngine.js` | BONUS — Fraud score engine, flag jobs, penalize users |
| `safetyEngine.js` | BONUS — Risk score, PIN generation/verification, panic handler, inactivity check |

### Controllers (`backend/controllers/`)
| File | What It Does |
|---|---|
| `authController.js` | Register user (Firebase Auth + Firestore), login with Firebase token, get profile |
| `jobController.js` | Create job, price estimate, scheduled pickup, cancel with reason, rate driver |
| `driverController.js` | Register driver, online/offline toggle, compliance gate |
| `quoteController.js` | Industrial quote flow + multi-driver bidding |
| `garageController.js` | On-site repair broadcast -> estimate bidding -> accept flow |
| `disciplineController.js` | Warnings, compliance check, safety checklists, priority queue, admin review |
| `incidentController.js` | BONUS — Live monitor, admin alerts, panic, inactivity check, analytics |
| `fraudController.js` | BONUS — Flagged jobs, user fraud stats, fraud score, apply penalty |
| `disputeController.js` | BONUS — Submit dispute, auto decision engine, admin override |
| `safetyController.js` | BONUS — Risk check, PIN, safety confirmation, post-job feedback |

### Routes (`backend/routes/`)
| File | Base Path |
|---|---|
| `authRoutes.js` | `/api/auth` |
| `jobRoutes.js` | `/api/jobs` |
| `driverRoutes.js` | `/api/drivers` |
| `quoteRoutes.js` | `/api/quotes` |
| `garageRoutes.js` | `/api/garage-requests` |
| `disciplineRoutes.js` | `/api/discipline` |
| `incidentRoutes.js` | BONUS `/api/incidents` |
| `fraudRoutes.js` | BONUS `/api/fraud` |
| `disputeRoutes.js` | BONUS `/api/disputes` |
| `safetyRoutes.js` | BONUS `/api/safety` |

### Models (`backend/models/`)
| File | What It Stores |
|---|---|
| `userModel.js` | User profile (uid, name, email, phone, role) |
| `jobModel.js` | Job document with all fields including scheduling, cancellation, fraud, safety |
| `driverModel.js` | Driver profile, truck type, equipment, compliance docs |
| `incidentModel.js` | BONUS — Safety incident with evidence, riskLevel, adminAction |
| `disputeModel.js` | BONUS — Dispute with evidence, decision, confidence score |

### Entry Points
| File | Purpose |
|---|---|
| `backend/server.js` | Local dev server (run with `node server.js`) |
| `functions/index.js` | Firebase Cloud Function entry — wraps the same Express app |

---

## Firebase Auth Flow

**How registration works:**
`POST /api/auth/register` -> creates a Firebase Auth account -> creates a Firestore `users` document with role, name, phone. The Firestore document is linked to the Firebase UID.

**How login works:**
Flutter calls `Firebase.signInWithEmailAndPassword()` -> gets `idToken` -> sends `POST /api/auth/login { idToken }` -> backend verifies using Firebase Admin SDK -> returns user profile from Firestore.

**How protected routes work:**
Every request to a protected endpoint must include `Authorization: Bearer <idToken>` in the header. The middleware in `backend/middleware/auth.js` verifies the token and attaches the user's UID and role to the request.

```
Flutter -> Firebase SDK -> idToken
     |
POST /api/auth/login { idToken }
     |
Backend -> Firebase Admin verifyIdToken()
     |
Returns: { uid, name, email, role, phone }
     |
All future requests: Authorization: Bearer <idToken>
```

---

## Bonus: Admin Safety Dashboard (`/api/incidents`)

The live monitor gives admin a real-time view of all active jobs. Each job has a color:
- Green — safe, no flags
- Yellow — safety flags or high risk detected
- Red — panic triggered or critical situation

**Endpoints:**

| Endpoint | What It Does |
|---|---|
| `GET /api/incidents/live` | Returns all active jobs with colors, open incident count, unread alert count |
| `GET /api/incidents/analytics` | Today's totals: jobs, completed, high-risk, panic count, avg response time |
| `GET /api/incidents/alerts` | Admin alert feed — panic, inactivity, fraud flags |
| `POST /api/incidents` | Report an incident (user, driver, or system) |
| `GET /api/incidents` | List incidents filtered by status, type, risk level |
| `GET /api/incidents/:id` | Full incident detail with related job |
| `PUT /api/incidents/:id/action` | Admin applies: `warn` / `suspend` / `ban` / `resolve` / `escalate` |
| `POST /api/incidents/panic` | Panic button — flags job red, creates alert + incident in one call |
| `POST /api/incidents/inactivity-check` | Finds jobs with no activity for 15+ minutes and flags them |

When admin warns a driver, the warning count increases. At 3 warnings, the driver is auto-suspended. Admin can apply ban manually for severe cases.

---

## Bonus: Fraud Detection System (`/api/fraud`)

**Fraud score formula:**
```
cancelRate > 50%       -> +2 points (user or driver)
price > 2x average     -> +3 points
location mismatch > 5km -> +3 points
job done in < 3 min    -> +2 points (ghost completion)
no photo on completion -> +1 point
driver has 2+ warnings -> +1 point

Score 0-2 = Safe
Score 3-5 = Suspicious
Score 6+  = High Risk (auto-flagged)
```

**Endpoints:**

| Endpoint | What It Does |
|---|---|
| `GET /api/fraud/jobs` | All flagged high-risk jobs for admin review |
| `GET /api/fraud/users` | Top suspicious users grouped by cancel rate and fraud score |
| `GET /api/fraud/score/:jobId` | Fraud score breakdown for a specific job |
| `POST /api/fraud/check` | Run fraud check on a job and store the result |
| `PUT /api/fraud/action` | Apply penalty: `warning`, `temporary_block` (7 days), `permanent_ban` |

---

## Bonus: Automated Dispute Resolution (`/api/disputes`)

When a dispute is submitted, the system immediately collects evidence from the job record (GPS arrival time, photo status, job completion status, price vs. estimate). Then it runs the decision engine:

```
Service not completed + no photos   -> refund_user      (90% confidence -> auto)
Price > 1.5x estimate               -> partial_refund   (85% confidence -> auto)
Price > 2x estimate                 -> refund_user      (85% confidence -> auto)
Driver no-show (no arrival time)    -> refund_user      (88% confidence -> auto)
User no-show confirmed by driver    -> charge_user      (80% confidence -> auto)
Delay                               -> partial_refund   (70% confidence -> admin)
Damage / conflicting data           -> escalate         (60% confidence -> admin)
```

If confidence is 80% or above, it resolves automatically with no admin needed. Below 80%, it goes to admin review with a suggested decision already shown.

**Endpoints:**

| Endpoint | What It Does |
|---|---|
| `POST /api/disputes` | Submit dispute — auto-collects evidence, runs decision engine |
| `GET /api/disputes` | All disputes (filter by status, type, reported by) |
| `GET /api/disputes/my/:userId` | User's own dispute history |
| `GET /api/disputes/:id` | Dispute detail with decision and evidence |
| `PUT /api/disputes/:id/resolve` | Admin approves or overrides the decision |

---

## Bonus: Safety System 2.0 (`/api/safety`)

**Risk score (pre-job):**
```
Highway location         -> +3 points
Industrial zone          -> +2 points
Desert / remote area     -> +2 points
Night time (10pm-5am)    -> +2 points
Qatar peak traffic hours -> +1 point
Basement / underground   -> +1 point
Heavy equipment service  -> +2 points

Score 0   = Low — normal flow
Score 1-3 = Medium — show safety warning
Score 4-5 = High — require safety confirmation
Score 6+  = Critical — urgent safety message
```

The system generates dynamic warning messages based on what triggered the risk (e.g., "You are on a high-speed road. Stay inside your vehicle and turn hazard lights ON.") instead of a static generic message.

**PIN Verification:**
When a job is assigned, the customer receives a 4-digit PIN. The driver must enter this PIN at arrival. The PIN is hashed (SHA-256) in Firestore — never stored in plain text. Entering the correct PIN automatically moves the job to `in_progress`.

**Endpoints:**

| Endpoint | What It Does |
|---|---|
| `POST /api/safety/risk-check` | Returns risk score, level, and specific warning messages |
| `POST /api/safety/pin/generate` | Generates 4-digit PIN for the job, returns raw PIN to customer |
| `POST /api/safety/pin/verify` | Driver enters PIN — correct PIN starts the job |
| `POST /api/safety/confirm` | Customer confirms safety checklist before job begins |
| `POST /api/safety/feedback` | Post-job safety rating — auto-creates incident if rated unsafe |
| `GET /api/safety/job/:jobId` | Returns current safety state of a job (PIN status, risk level, flags) |

---

## Firebase Status

| Item | Status |
|---|---|
| Cloud Functions v5.0.0 (me-central1) | Deployed |
| Firestore Security Rules | Deployed |
| Firestore Indexes | Deployed |
| Firebase Auth — Email/Password | Enabled |
| Firebase Auth — Google Sign-In | Enabled |
| Firestore Collections | Live (`users`, `jobs`, `drivers`, `incidents`, `disputes`, `fraud_flags`, `admin_alerts`, `safety_confirmations`, `safety_feedback`) |

**Production URL:** `https://api-h6acdw3itq-ww.a.run.app`

---

## Firestore Security Rules

All collections have role-based rules deployed. Summary:
- `users` — users can only read/write their own document. Admin can read all.
- `jobs` — any signed-in user can create and read. Admin can delete.
- `drivers` — drivers can update their own profile. Admin has full control.
- `incidents` — any signed-in user can report. Only admin can take action.
- `disputes` — signed-in users can submit and view own. Only admin can resolve.
- `fraud_flags` — admin only.
- `admin_alerts` — system writes, admin reads and marks as read.

File: `firestore.rules`

---

## Postman & API Docs

**Collection file:** `api/RoadResQ_API_v4_Complete.postman_collection.json`
**Local environment:** `docs/RoadResQ_Local.postman_environment.json`
**Production environment:** `docs/RoadResQ_Production.postman_environment.json`
**Integration guide:** `api/README.md`

The Postman collection includes:
- Firebase Token Helper folder — get a Firebase `idToken` without the mobile app, for testing
- Auth folder with register, login, get profile
- All job types with example bodies (scheduled, basement, heavy, etc.)
- All new bonus endpoints (incidents, fraud, disputes, safety)
- Environment variables for `base_url` and `token` pre-filled

To use: import the collection + production environment JSON into Postman, set the `token` variable, and all protected requests work immediately.

---

## GitHub

**Branch:** `backend-dev`
**Latest commit:** `71df14a` (or latest)
**Repo:** https://github.com/Rover-dotcom/RoadResQ

All files committed:
- `backend/` — full source code
- `functions/` — Firebase Cloud Function (mirrors backend/)
- `api/` — Postman collection + environment files + README
- `docs/` — Week 4 and Week 5 reports
- `firestore.rules` — deployed security rules
- `firestore.indexes.json` — deployed indexes
- `firebase.json` — project configuration
