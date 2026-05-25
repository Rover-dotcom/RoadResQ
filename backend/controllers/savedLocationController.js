/**
 * Saved Location Controller — RoadResQ v9.0.0 (Week 7)
 *
 * POST   /api/saved-locations      — Save a location
 * GET    /api/saved-locations      — Get user's saved locations
 * PUT    /api/saved-locations/:id  — Update a saved location
 * DELETE /api/saved-locations/:id  — Delete a saved location
 */

const { db } = require('../config/firebase');

const ok   = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const fail = (res, msg, code = 400) => res.status(code).json({ status: 'error', message: msg });

const saveLocation = async (req, res) => {
  try {
    const { label, address, lat, lng } = req.body;
    if (!label || !address || lat == null || lng == null) {
      return fail(res, 'label, address, lat, and lng are required.');
    }
    const doc = {
      userId: req.user.uid,
      label,
      address,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      createdAt: new Date().toISOString(),
    };
    const ref = await db.collection('saved_locations').add(doc);
    return ok(res, { id: ref.id, ...doc }, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

const getLocations = async (req, res) => {
  try {
    const snap = await db.collection('saved_locations')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    const locations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return ok(res, { locations, count: locations.length });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection('saved_locations').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return fail(res, 'Location not found.', 404);
    if (snap.data().userId !== req.user.uid && req.user.role !== 'admin') {
      return fail(res, 'Access denied.', 403);
    }
    const updates = {};
    if (req.body.label) updates.label = req.body.label;
    if (req.body.address) updates.address = req.body.address;
    if (req.body.lat != null) updates.lat = parseFloat(req.body.lat);
    if (req.body.lng != null) updates.lng = parseFloat(req.body.lng);
    updates.updatedAt = new Date().toISOString();
    await ref.update(updates);
    return ok(res, { id, ...updates });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection('saved_locations').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return fail(res, 'Location not found.', 404);
    if (snap.data().userId !== req.user.uid && req.user.role !== 'admin') {
      return fail(res, 'Access denied.', 403);
    }
    await ref.delete();
    return ok(res, { deleted: true, id });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

module.exports = { saveLocation, getLocations, updateLocation, deleteLocation };
