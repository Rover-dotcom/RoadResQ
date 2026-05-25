/**
 * Maps Routes — RoadResQ (Week 6 v8.0.0)
 */

const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getRouteHandler,
  getDistanceMatrixHandler,
  geocodeHandler,
  reverseGeocodeHandler,
  getPolylineHandler,
  mapsStatusHandler,
  clearCacheHandler,
} = require('../controllers/mapsController');

const router = Router();

router.get('/route', getRouteHandler);
router.get('/distance-matrix', getDistanceMatrixHandler);
router.post('/distance-matrix', getDistanceMatrixHandler);
router.get('/geocode', geocodeHandler);
router.get('/reverse-geocode', reverseGeocodeHandler);
router.get('/polyline', getPolylineHandler);
router.get('/status', mapsStatusHandler);
router.post('/clear-cache', verifyToken, requireRole('admin'), clearCacheHandler);

module.exports = router;
