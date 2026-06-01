/**
 * Vehicle Routes — RoadResQ v9.0.0 (Week 7)
 */
const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  saveVehicle, getVehicles, updateVehicle, deleteVehicle, setDefaultVehicle,
} = require('../controllers/vehicleController');

const router = Router();

router.post('/',           verifyToken, saveVehicle);
router.get('/',            verifyToken, getVehicles);
router.put('/:id',         verifyToken, updateVehicle);
router.delete('/:id',      verifyToken, deleteVehicle);
router.put('/:id/default', verifyToken, setDefaultVehicle);

module.exports = router;
