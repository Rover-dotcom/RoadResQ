import 'dart:async';
import 'package:flutter/material.dart';
import 'package:road_resq/models/garage_model.dart';
import 'package:road_resq/services/garage_service.dart';

/// Garage Provider — wraps GarageService for reactive UI state.
///
/// Used by:
///   - Repair flow (garage selection screen)
///   - Workshop portal (workshop dashboard)
///   - Admin panel (garage verification)
class GarageProvider extends ChangeNotifier {
  final GarageService _garageService = GarageService();

  // ─── State ───────────────────────────────────────────────────────────────────

  bool _isLoading = false;
  String? _errorMessage;
  List<GarageModel> _garages = [];
  List<GarageModel> _verifiedGarages = [];
  GarageModel? _selectedGarage;

  StreamSubscription<List<GarageModel>>? _garageSubscription;

  // ─── Getters ─────────────────────────────────────────────────────────────────

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  List<GarageModel> get garages => _garages;
  List<GarageModel> get verifiedGarages => _verifiedGarages;
  GarageModel? get selectedGarage => _selectedGarage;

  // ─── Load Garages ─────────────────────────────────────────────────────────────

  Future<void> loadGarages() async {
    _setLoading(true);
    _clearError();
    try {
      _garages = await _garageService.getGarages();
      notifyListeners();
    } catch (e) {
      _setError('Failed to load garages: $e');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadVerifiedGarages() async {
    _setLoading(true);
    _clearError();
    try {
      _verifiedGarages = await _garageService.getVerifiedGarages();
      notifyListeners();
    } catch (e) {
      _setError('Failed to load verified garages: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Real-time stream of all garages.
  void listenToGarages() {
    _garageSubscription?.cancel();
    _garageSubscription = _garageService.streamGarages().listen(
      (garages) {
        _garages = garages;
        notifyListeners();
      },
      onError: (e) => _setError('Garage stream error: $e'),
    );
  }

  // ─── Select Garage ────────────────────────────────────────────────────────────

  void selectGarage(GarageModel garage) {
    _selectedGarage = garage;
    notifyListeners();
  }

  void clearSelectedGarage() {
    _selectedGarage = null;
    notifyListeners();
  }

  // ─── Admin: Verify / Unverify ─────────────────────────────────────────────────

  Future<void> verifyGarage(String garageId) async {
    try {
      await _garageService.verifyGarage(garageId);
      await loadGarages();
    } catch (e) {
      _setError('Failed to verify garage: $e');
    }
  }

  Future<void> unverifyGarage(String garageId) async {
    try {
      await _garageService.unverifyGarage(garageId);
      await loadGarages();
    } catch (e) {
      _setError('Failed to unverify garage: $e');
    }
  }

  // ─── Register Garage (Workshop Onboarding) ─────────────────────────────────

  Future<void> registerGarage(GarageModel garage) async {
    _setLoading(true);
    _clearError();
    try {
      await _garageService.addGarage(
        name: garage.name,
        location: garage.location,
        ownerUid: garage.ownerUid,
        phone: garage.phone,
        geoPoint: garage.geoPoint,
      );
      await loadGarages();
    } catch (e) {
      _setError('Failed to register garage: $e');
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
    _garageSubscription?.cancel();
    super.dispose();
  }
}
