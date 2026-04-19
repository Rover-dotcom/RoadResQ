import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:road_resq/models/driver_model.dart';
import 'package:road_resq/services/driver_service.dart';

/// Driver Provider — Week 3 State Management
///
/// Wraps DriverService for reactive state in Flutter UI.
/// Used by the Driver Dashboard screen.
class DriverProvider extends ChangeNotifier {
  final DriverService _driverService = DriverService();

  // ─── State ───────────────────────────────────────────────────────────────────

  bool _isLoading = false;
  String? _errorMessage;
  DriverModel? _driverProfile;
  List<DriverModel> _allDrivers = [];
  bool _isOnline = false;

  StreamSubscription<DriverModel?>? _profileSubscription;

  // ─── Getters ─────────────────────────────────────────────────────────────────

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  DriverModel? get driverProfile => _driverProfile;
  List<DriverModel> get allDrivers => _allDrivers;
  bool get isOnline => _isOnline;
  String? get vehicleType => _driverProfile?.vehicleType;

  // ─── Load Driver Profile ─────────────────────────────────────────────────────

  Future<void> loadDriverProfile(String uid) async {
    _setLoading(true);
    _clearError();
    try {
      _driverProfile = await _driverService.getDriverProfile(uid);
      _isOnline = _driverProfile?.isOnline ?? false;
      notifyListeners();
    } catch (e) {
      _setError('Failed to load driver profile: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Listen to driver profile in real-time (changes from admin approval, etc.)
  void listenToDriverProfile(String uid) {
    _profileSubscription?.cancel();
    _profileSubscription = _driverService.streamDriverProfile(uid).listen(
      (driver) {
        _driverProfile = driver;
        _isOnline = driver?.isOnline ?? false;
        notifyListeners();
      },
      onError: (e) => _setError('Driver profile stream error: $e'),
    );
  }

  // ─── PUT /driver/status ──────────────────────────────────────────────────────

  /// Toggle online/offline — called from Driver Dashboard.
  Future<void> toggleOnlineStatus({
    required String driverUid,
    GeoPoint? currentLocation,
  }) async {
    final newStatus = !_isOnline;
    _isOnline = newStatus;
    notifyListeners(); // Optimistic update

    try {
      await _driverService.setOnlineStatus(
        driverUid: driverUid,
        isOnline: newStatus,
        location: currentLocation,
      );
    } catch (e) {
      // Revert on failure
      _isOnline = !newStatus;
      _setError('Failed to update status: $e');
    }
  }

  /// Explicitly set online status.
  Future<void> setOnlineStatus({
    required String driverUid,
    required bool isOnline,
    GeoPoint? location,
  }) async {
    try {
      await _driverService.setOnlineStatus(
        driverUid: driverUid,
        isOnline: isOnline,
        location: location,
      );
      _isOnline = isOnline;
      notifyListeners();
    } catch (e) {
      _setError('Failed to set online status: $e');
    }
  }

  // ─── Update Location ─────────────────────────────────────────────────────────

  Future<void> updateLocation({
    required String driverUid,
    required double latitude,
    required double longitude,
  }) async {
    try {
      await _driverService.updateLocation(
        driverUid: driverUid,
        latitude: latitude,
        longitude: longitude,
      );
    } catch (e) {
      _setError('Failed to update location: $e');
    }
  }

  // ─── Admin: Load All Drivers ─────────────────────────────────────────────────

  Future<void> loadAllDrivers() async {
    _setLoading(true);
    _clearError();
    try {
      _allDrivers = await _driverService.getAllDrivers();
      notifyListeners();
    } catch (e) {
      _setError('Failed to load drivers: $e');
    } finally {
      _setLoading(false);
    }
  }

  // ─── Admin: Approve / Revoke ─────────────────────────────────────────────────

  Future<void> approveDriver(String driverUid) async {
    try {
      await _driverService.approveDriver(driverUid);
      // Refresh locally
      await loadAllDrivers();
    } catch (e) {
      _setError('Failed to approve driver: $e');
    }
  }

  Future<void> revokeDriver(String driverUid) async {
    try {
      await _driverService.revokeDriver(driverUid);
      await loadAllDrivers();
    } catch (e) {
      _setError('Failed to revoke driver: $e');
    }
  }

  // ─── Create Driver Profile ───────────────────────────────────────────────────

  Future<void> registerDriver(DriverModel driver) async {
    _setLoading(true);
    _clearError();
    try {
      await _driverService.createDriverProfile(driver);
      _driverProfile = driver;
      notifyListeners();
    } catch (e) {
      _setError('Failed to register driver: $e');
    } finally {
      _setLoading(false);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String message) {
    _errorMessage = message;
    notifyListeners();
  }

  void _clearError() {
    _errorMessage = null;
  }

  void clearError() => _clearError();

  @override
  void dispose() {
    _profileSubscription?.cancel();
    super.dispose();
  }
}
