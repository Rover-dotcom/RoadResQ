/**
 * Maps Routes — RoadResQ (Week 6 v8.0.0)
 */

const { Router } = require('express');
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
router.post('/clear-cache', clearCacheHandler);

module.exports = router;
