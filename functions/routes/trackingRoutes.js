/**
 * Tracking Routes — RoadResQ (Week 6 v8.0.0)
 *
 * GPS tracking, nearby drivers, live ETA, arrival detection,
 * route recalculation, trip progress, batch updates.
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/trackingController');

// Driver GPS push (called every 5-10 sec by driver app)
router.post('/location', verifyToken, ctrl.pushLocation);

// Find nearby drivers within radius
router.get('/nearby', verifyToken, ctrl.getNearbyDrivers);

// Get a specific driver's location
router.get('/driver/:driverId', verifyToken, ctrl.getDriverLocationEndpoint);

// Set driver offline / online
router.post('/offline/:driverId', verifyToken, ctrl.goOffline);
router.post('/driver/:driverId/online', verifyToken, ctrl.goOnline);

// Calculate route distance + ETA between two points
router.get('/route', verifyToken, ctrl.getRouteInfo);

// Job tracking
router.post('/job/:jobId/start', verifyToken, ctrl.startTracking);
router.get('/job/:jobId', verifyToken, ctrl.getJobTrackingData);
router.get('/job/:jobId/eta', verifyToken, ctrl.getJobETA);
router.post('/driver-arrived/:jobId', verifyToken, ctrl.detectArrival);

// Week 6 v8.0.0 — Route recalculation + progress
router.post('/recalculate/:jobId', verifyToken, ctrl.recalculateRouteEndpoint);
router.get('/progress/:jobId', verifyToken, ctrl.getTripProgressEndpoint);
router.get('/polyline', verifyToken, ctrl.getPolylineEndpoint);
router.post('/batch-update', verifyToken, ctrl.batchUpdateEndpoint);

module.exports = router;

