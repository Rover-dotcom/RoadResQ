/**
 * Saved Location Routes — RoadResQ v9.0.0 (Week 7)
 */
const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');
const { saveLocation, getLocations, updateLocation, deleteLocation } = require('../controllers/savedLocationController');

const router = Router();

router.post('/',     verifyToken, saveLocation);
router.get('/',      verifyToken, getLocations);
router.put('/:id',   verifyToken, updateLocation);
router.delete('/:id', verifyToken, deleteLocation);

module.exports = router;
