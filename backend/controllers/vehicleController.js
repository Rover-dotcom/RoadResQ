/**
 * Vehicle Controller — RoadResQ v9.0.0 (Week 7)
 *
 * Customer saved vehicles (multiple cars per customer).
 *
 * POST   /api/vehicles          — Save a vehicle
 * GET    /api/vehicles          — Get user's saved vehicles
 * PUT    /api/vehicles/:id      — Update a saved vehicle
 * DELETE /api/vehicles/:id      — Delete a saved vehicle
 * PUT    /api/vehicles/:id/default — Set as default vehicle
 */

const { db } = require('../config/firebase');

const ok   = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const fail = (res, msg, code = 400) => res.status(code).json({ status: 'error', message: msg });

// ─── Vehicle Types ───────────────────────────────────────────────────────────

const VEHICLE_TYPES = [
  'Sedan', 'SUV', '4x4', 'Pickup', 'Van', 'Truck',
  'Motorcycle', 'ATV', 'Bus', 'Heavy Vehicle', 'Others',
];

// ─── Save Vehicle ────────────────────────────────────────────────────────────

const saveVehicle = async (req, res) => {
  try {
    const { make, model, year, plateNumber, color, vehicleType, notes } = req.body;
    if (!make || !model || !plateNumber) {
      return fail(res, 'make, model, and plateNumber are required.');
    }

    // Check if plate number already saved by this user
    const existing = await db.collection('saved_vehicles')
      .where('userId', '==', req.user.uid)
      .where('plateNumber', '==', plateNumber.toUpperCase().trim())
      .get();
    if (!existing.empty) {
      return fail(res, 'This plate number is already saved.');
    }

    // Check max 10 vehicles per user
    const countSnap = await db.collection('saved_vehicles')
      .where('userId', '==', req.user.uid)
      .get();
    if (countSnap.size >= 10) {
      return fail(res, 'Maximum 10 vehicles allowed per account.');
    }

    const isFirst = countSnap.empty; // First vehicle = default
    const doc = {
      userId: req.user.uid,
      make: make.trim(),
      model: model.trim(),
      year: year ? parseInt(year) : null,
      plateNumber: plateNumber.toUpperCase().trim(),
      color: color || null,
      vehicleType: vehicleType || 'Sedan',
      notes: notes || null,
      isDefault: isFirst,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const ref = await db.collection('saved_vehicles').add(doc);
    return ok(res, { id: ref.id, ...doc }, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// ─── Get Vehicles ────────────────────────────────────────────────────────────

const getVehicles = async (req, res) => {
  try {
    const snap = await db.collection('saved_vehicles')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    const vehicles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return ok(res, { vehicles, count: vehicles.length });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// ─── Update Vehicle ──────────────────────────────────────────────────────────

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection('saved_vehicles').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return fail(res, 'Vehicle not found.', 404);
    if (snap.data().userId !== req.user.uid && req.user.role !== 'admin') {
      return fail(res, 'Access denied.', 403);
    }

    const allowed = ['make', 'model', 'year', 'plateNumber', 'color', 'vehicleType', 'notes'];
    const updates = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) {
        updates[key] = key === 'plateNumber'
          ? req.body[key].toUpperCase().trim()
          : key === 'year' ? parseInt(req.body[key]) : req.body[key];
      }
    });
    updates.updatedAt = new Date().toISOString();

    await ref.update(updates);
    return ok(res, { id, ...updates });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// ─── Delete Vehicle ──────────────────────────────────────────────────────────

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection('saved_vehicles').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return fail(res, 'Vehicle not found.', 404);
    if (snap.data().userId !== req.user.uid && req.user.role !== 'admin') {
      return fail(res, 'Access denied.', 403);
    }

    const wasDefault = snap.data().isDefault;
    await ref.delete();

    // If deleted vehicle was default, make the oldest remaining vehicle default
    if (wasDefault) {
      const remaining = await db.collection('saved_vehicles')
        .where('userId', '==', req.user.uid)
        .orderBy('createdAt', 'asc')
        .limit(1)
        .get();
      if (!remaining.empty) {
        await remaining.docs[0].ref.update({ isDefault: true, updatedAt: new Date().toISOString() });
      }
    }

    return ok(res, { deleted: true, id });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// ─── Set Default Vehicle ─────────────────────────────────────────────────────

const setDefaultVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection('saved_vehicles').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return fail(res, 'Vehicle not found.', 404);
    if (snap.data().userId !== req.user.uid && req.user.role !== 'admin') {
      return fail(res, 'Access denied.', 403);
    }

    // Unset current defaults
    const allSnap = await db.collection('saved_vehicles')
      .where('userId', '==', req.user.uid)
      .where('isDefault', '==', true)
      .get();
    const batch = db.batch();
    allSnap.docs.forEach(d => batch.update(d.ref, { isDefault: false }));
    batch.update(ref, { isDefault: true, updatedAt: new Date().toISOString() });
    await batch.commit();

    return ok(res, { id, isDefault: true });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

module.exports = {
  VEHICLE_TYPES,
  saveVehicle, getVehicles, updateVehicle, deleteVehicle, setDefaultVehicle,
};
