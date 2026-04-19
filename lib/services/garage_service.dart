import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:road_resq/models/garage_model.dart';
import 'package:road_resq/services/firestore_service.dart';
import 'package:uuid/uuid.dart';

/// Garage Service — Week 2 + Week 3
///
/// APIs implemented:
///   POST  /garages          → addGarage()
///   GET   /garages          → getGarages()
///   GET   /garages/:id      → getGarageById()
///   PUT   /garages/:id      → updateGarage()
///   PUT   /garages/:id/verify → verifyGarage()
///   DELETE /garages/:id     → deleteGarage()
class GarageService {
  final FirestoreService _fs = FirestoreService();
  final Uuid _uuid = const Uuid();

  // ─── POST /garages ───────────────────────────────────────────────────────────

  /// Adds a new garage to Firestore.
  Future<GarageModel> addGarage({
    required String name,
    required String location,
    required String ownerUid,
    required String phone,
    GeoPoint? geoPoint,
  }) async {
    final id = _uuid.v4();
    final garage = GarageModel(
      id: id,
      name: name.trim(),
      location: location.trim(),
      geoPoint: geoPoint,
      ownerUid: ownerUid,
      phone: phone.trim(),
      isVerified: false,
      createdAt: DateTime.now(),
    );

    await _fs.set(_fs.garages, id, garage.toMap());
    return garage;
  }

  // ─── GET /garages ────────────────────────────────────────────────────────────

  Future<List<GarageModel>> getGarages() async {
    final snapshot = await _fs.garages
        .orderBy('createdAt', descending: true)
        .get();
    return snapshot.docs.map((doc) => GarageModel.fromDocument(doc)).toList();
  }

  /// Returns only verified garages (for customer garage selection).
  Future<List<GarageModel>> getVerifiedGarages() async {
    final snapshot = await _fs.garages
        .where('isVerified', isEqualTo: true)
        .orderBy('name')
        .get();
    return snapshot.docs.map((doc) => GarageModel.fromDocument(doc)).toList();
  }

  // ─── Real-time streams ───────────────────────────────────────────────────────

  Stream<List<GarageModel>> streamGarages() {
    return _fs.garages.orderBy('createdAt', descending: true).snapshots().map(
      (snapshot) =>
          snapshot.docs.map((doc) => GarageModel.fromDocument(doc)).toList(),
    );
  }

  // ─── GET /garages/:id ────────────────────────────────────────────────────────

  Future<GarageModel?> getGarageById(String id) async {
    final doc = await _fs.get(_fs.garages, id);
    if (!doc.exists) return null;
    return GarageModel.fromDocument(doc);
  }

  // ─── PUT /garages/:id ────────────────────────────────────────────────────────

  Future<void> updateGarage({
    required String garageId,
    String? name,
    String? location,
    String? phone,
    GeoPoint? geoPoint,
  }) async {
    final updates = <String, dynamic>{};
    if (name != null) updates['name'] = name;
    if (location != null) updates['location'] = location;
    if (phone != null) updates['phone'] = phone;
    if (geoPoint != null) updates['geoPoint'] = geoPoint;
    if (updates.isEmpty) return;
    await _fs.update(_fs.garages, garageId, updates);
  }

  // ─── PUT /garages/:id/verify (admin) ────────────────────────────────────────

  Future<void> verifyGarage(String garageId) async {
    await _fs.update(_fs.garages, garageId, {'isVerified': true});
  }

  Future<void> unverifyGarage(String garageId) async {
    await _fs.update(_fs.garages, garageId, {'isVerified': false});
  }

  // ─── DELETE /garages/:id ────────────────────────────────────────────────────

  Future<void> deleteGarage(String garageId) async {
    await _fs.delete(_fs.garages, garageId);
  }
}
