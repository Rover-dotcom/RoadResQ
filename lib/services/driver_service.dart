import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:road_resq/models/driver_model.dart';
import 'package:road_resq/services/firestore_service.dart';

/// Driver Service — Weeks 2 + 3
///
/// APIs implemented:
///   PUT    /driver/status        → setOnlineStatus()
///   GET    /drivers/:id          → getDriverProfile()
///   POST   /drivers              → createDriverProfile()
///   PUT    /drivers/:id          → updateDriverProfile()
///   GET    /drivers (admin)      → getAllDrivers()
///   PUT    /drivers/:id/approve  → approveDriver()
class DriverService {
  final FirestoreService _fs = FirestoreService();

  // ─── Create Driver Profile ───────────────────────────────────────────────────

  /// Creates a driver document in Firestore when a driver registers.
  Future<void> createDriverProfile(DriverModel driver) async {
    await _fs.set(_fs.drivers, driver.uid, driver.toMap());
  }

  // ─── GET /drivers/:id ───────────────────────────────────────────────────────

  Future<DriverModel?> getDriverProfile(String uid) async {
    final doc = await _fs.get(_fs.drivers, uid);
    if (!doc.exists) return null;
    return DriverModel.fromDocument(doc);
  }

  // ─── Real-time stream of driver profile ─────────────────────────────────────

  Stream<DriverModel?> streamDriverProfile(String uid) {
    return _fs.drivers.doc(uid).snapshots().map((doc) {
      if (!doc.exists) return null;
      return DriverModel.fromDocument(doc);
    });
  }

  // ─── PUT /driver/status ──────────────────────────────────────────────────────

  /// Toggles a driver's online/offline status.
  /// Also updates lastLocation if a GeoPoint is provided.
  Future<void> setOnlineStatus({
    required String driverUid,
    required bool isOnline,
    GeoPoint? location,
  }) async {
    final updates = <String, dynamic>{'isOnline': isOnline};
    if (location != null) {
      updates['lastLocation'] = location;
    }
    await _fs.update(_fs.drivers, driverUid, updates);
  }

  // ─── PUT /drivers/:id ────────────────────────────────────────────────────────

  Future<void> updateDriverProfile({
    required String driverUid,
    String? name,
    String? vehicleType,
    String? licenseNumber,
    String? experience,
    GeoPoint? lastLocation,
  }) async {
    final updates = <String, dynamic>{};
    if (name != null) updates['name'] = name;
    if (vehicleType != null) updates['vehicleType'] = vehicleType;
    if (licenseNumber != null) updates['licenseNumber'] = licenseNumber;
    if (experience != null) updates['experience'] = experience;
    if (lastLocation != null) updates['lastLocation'] = lastLocation;
    if (updates.isEmpty) return;
    await _fs.update(_fs.drivers, driverUid, updates);
  }

  // ─── GET /drivers (admin) ────────────────────────────────────────────────────

  Future<List<DriverModel>> getAllDrivers() async {
    final snapshot = await _fs.drivers
        .orderBy('createdAt', descending: true)
        .get();
    return snapshot.docs.map((doc) => DriverModel.fromDocument(doc)).toList();
  }

  // ─── Real-time stream for admin panel ────────────────────────────────────────

  Stream<List<DriverModel>> streamAllDrivers() {
    return _fs.drivers.orderBy('createdAt', descending: true).snapshots().map(
      (snapshot) =>
          snapshot.docs.map((doc) => DriverModel.fromDocument(doc)).toList(),
    );
  }

  // ─── PUT /drivers/:id/approve ────────────────────────────────────────────────

  /// Admin approves a driver.
  Future<void> approveDriver(String driverUid) async {
    await _fs.update(_fs.drivers, driverUid, {'isApproved': true});
  }

  /// Admin revokes a driver's approval.
  Future<void> revokeDriver(String driverUid) async {
    await _fs.update(_fs.drivers, driverUid, {'isApproved': false});
  }

  // ─── Filtering: Online + Approved Drivers ────────────────────────────────────

  /// Returns only approved + online drivers — used for admin monitoring.
  Future<List<DriverModel>> getActiveDrivers() async {
    final snapshot = await _fs.drivers
        .where('isOnline', isEqualTo: true)
        .where('isApproved', isEqualTo: true)
        .get();
    return snapshot.docs.map((doc) => DriverModel.fromDocument(doc)).toList();
  }

  /// Returns drivers who match the given vehicle type and are approved + online.
  /// Used by the job matching system (Week 3).
  Future<List<DriverModel>> getMatchingDrivers(String vehicleType) async {
    final snapshot = await _fs.drivers
        .where('isOnline', isEqualTo: true)
        .where('isApproved', isEqualTo: true)
        .where('vehicleType', isEqualTo: vehicleType)
        .get();
    return snapshot.docs.map((doc) => DriverModel.fromDocument(doc)).toList();
  }

  // ─── Update Driver Location ──────────────────────────────────────────────────

  Future<void> updateLocation({
    required String driverUid,
    required double latitude,
    required double longitude,
  }) async {
    await _fs.update(_fs.drivers, driverUid, {
      'lastLocation': GeoPoint(latitude, longitude),
    });
  }
}
