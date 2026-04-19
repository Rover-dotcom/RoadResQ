# RoadResQ Backend

Node.js + Express REST API using Firebase Admin SDK (Firestore).

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your Firebase credentials in .env or add serviceAccountKey.json to backend/config/
node server.js
```

## Folder Structure

```
backend/
├── server.js              # Express entry point
├── config/
│   └── firebase.js        # Firebase Admin SDK init
├── controllers/
│   ├── authController.js  # POST /register, POST /login
│   ├── jobController.js   # All /jobs endpoints
│   ├── driverController.js
│   └── quoteController.js
├── routes/
│   ├── authRoutes.js
│   ├── jobRoutes.js
│   ├── driverRoutes.js
│   └── quoteRoutes.js
├── models/
│   ├── userModel.js       # Firestore user operations
│   ├── driverModel.js     # Firestore driver operations
│   └── jobModel.js        # Firestore job operations
└── utils/
    └── categoryEngine.js  # getCategory() + calculatePrice()
```

## API Endpoints

### Auth
| Method | Endpoint              | Body                                      |
|--------|-----------------------|-------------------------------------------|
| POST   | `/api/auth/register`  | `{ name, email, password, phone, role? }` |
| POST   | `/api/auth/login`     | `{ idToken }`                             |

### Jobs
| Method | Endpoint                    | Body / Query                              |
|--------|-----------------------------|-------------------------------------------|
| POST   | `/api/jobs`                 | `{ userId, serviceType, vehicleType, pickup, drop, distanceKm? }` |
| GET    | `/api/jobs`                 | `?userId=` or `?driverId=`                |
| GET    | `/api/jobs/available`       | `?vehicleType=`                           |
| GET    | `/api/jobs/price-estimate`  | `?vehicleType=&distanceKm=`               |
| GET    | `/api/jobs/:id`             |                                           |
| PUT    | `/api/jobs/:id/accept`      | `{ driverId }`                            |
| PUT    | `/api/jobs/:id/status`      | `{ status }`                              |

### Drivers
| Method | Endpoint                    | Body                                      |
|--------|-----------------------------|-------------------------------------------|
| POST   | `/api/drivers`              | `{ uid, name, vehicleType, licenseNumber }` |
| GET    | `/api/drivers`              | `?vehicleType=` (filtering)               |
| GET    | `/api/drivers/:id`          |                                           |
| PUT    | `/api/drivers/status`       | `{ driverUid, isOnline }`                 |
| PUT    | `/api/drivers/:id/approve`  | `{ approve: true/false }`                 |

### Quotes
| Method | Endpoint                    | Body                                      |
|--------|-----------------------------|-------------------------------------------|
| POST   | `/api/quotes`               | `{ userId, description, pickup, drop }`   |
| GET    | `/api/quotes`               | `?userId=`                                |
| PUT    | `/api/quotes/:id/respond`   | `{ quotedPrice }`                         |

## Pricing Logic

```
base          = 250
perKm         = 5
heavyMultiplier = 1.5

price = base + (distanceKm × perKm × multiplier)

Leisure (Sedan, SUV, 4x4, Motorcycle, ATV):   250 + (km × 5 × 1.0)
Heavy   (Container, Precast, Pallets, etc.):   250 + (km × 5 × 1.5)
```

## Postman Collection

Import the requests manually or test these endpoints:

```
POST http://localhost:3000/api/auth/register
POST http://localhost:3000/api/auth/login
POST http://localhost:3000/api/jobs
GET  http://localhost:3000/api/jobs
GET  http://localhost:3000/api/jobs/available?vehicleType=Sedan
PUT  http://localhost:3000/api/jobs/:id/accept
POST http://localhost:3000/api/quotes
PUT  http://localhost:3000/api/drivers/status
```
