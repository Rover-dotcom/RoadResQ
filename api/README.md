# RoadResQ — API Testing Resources

This folder contains all files needed to test the RoadResQ backend API using Postman.

## Files

| File | Description |
|---|---|
| `RoadResQ_API_v4_Complete.postman_collection.json` | Complete API collection — all endpoints organized by role |
| `RoadResQ_Production.postman_environment.json` | Production environment variables (live Doha server) |

## Setup

1. Open **Postman**
2. Click **Import** → select `RoadResQ_API_v4_Complete.postman_collection.json`
3. Click **Import** again → select `RoadResQ_Production.postman_environment.json`
4. Select **RoadResQ Production** from the environment dropdown (top right)
5. All requests are ready to run

## Base URL

```
https://api-h6acdw3itq-ww.a.run.app
```

## Collection Structure

| Folder | Description |
|---|---|
| 🔐 Auth | User registration and profile |
| 🚗 Jobs — Customer | Create jobs, view my-jobs, live status tracking |
| 🚛 Jobs — Driver | Available jobs feed, accept job, update status |
| 🔍 Matching & Pricing | Service catalog, price calculator, driver matching |
| 📋 Quotes | Submit quote, garage responds, customer accepts/rejects |
| 🔧 Garage (On-Site Repair) | Repair requests, garage estimates, accept estimate |
| 👤 Drivers | Register driver, online/offline toggle, status, approval |
| 📊 Admin Reports | Read-only: all jobs, quotes, garage requests, drivers |

## Pricing Note

All prices are in **Qatar Riyal (QAR)** using integer halala units.  
Divide by 100 for display value — e.g. `4500` = **QR 45.00**

## Key Flows

**Towing Job:**
```
POST /api/jobs → GET /api/jobs/my-jobs → GET /api/jobs/:id/status
```

**Quote (Industrial/Heavy):**
```
POST /api/quotes → PUT /api/quotes/:id/respond (garage) → PUT /api/quotes/:id/accept
```

**On-Site Repair:**
```
POST /api/garage-requests → POST /api/garage-requests/:id/estimate → PUT /api/garage-requests/:id/accept
```

**Driver Online/Offline:**
```
PUT /api/drivers/:id/online → (take jobs) → PUT /api/drivers/:id/offline
```
