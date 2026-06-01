/**
 * Maps Routes — RoadResQ (Week 8 v9.1.0)
 */

const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getRouteHandler,
  getDistanceMatrixHandler,
  geocodeHandler,
  reverseGeocodeHandler,
  getPolylineHandler,
  autocompleteHandler,
  placeDetailsHandler,
  driverETAHandler,
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
router.get('/autocomplete', autocompleteHandler);              // Week 8: address search
router.get('/place-details', placeDetailsHandler);             // Week 8: place details
router.get('/driver-eta', driverETAHandler);                   // Week 8: driver ETA to pickup
router.get('/status', mapsStatusHandler);
router.post('/clear-cache', verifyToken, requireRole('admin'), clearCacheHandler);

module.exports = router;
