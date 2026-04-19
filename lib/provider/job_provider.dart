import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:road_resq/models/job_model.dart';
import 'package:road_resq/services/job_service.dart';

/// Job Provider — Week 3 State Management
///
/// Wraps JobService and exposes reactive state for Flutter UI.
/// Screens listen to this provider via Consumer<JobProvider>.
class JobProvider extends ChangeNotifier {
  final JobService _jobService = JobService();

  // ─── State ───────────────────────────────────────────────────────────────────

  bool _isLoading = false;
  String? _errorMessage;
  JobModel? _currentJob;
  List<JobModel> _userJobHistory = [];
  List<JobModel> _driverJobHistory = [];
  List<JobModel> _availableJobs = [];

  StreamSubscription<JobModel?>? _jobStatusSubscription;
  StreamSubscription<List<JobModel>>? _availableJobsSubscription;
  StreamSubscription<List<JobModel>>? _userHistorySubscription;

  // ─── Getters ─────────────────────────────────────────────────────────────────

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  JobModel? get currentJob => _currentJob;
  List<JobModel> get userJobHistory => _userJobHistory;
  List<JobModel> get driverJobHistory => _driverJobHistory;
  List<JobModel> get availableJobs => _availableJobs;

  // ─── POST /jobs ──────────────────────────────────────────────────────────────

  /// Creates a job and automatically starts listening to its status.
  Future<JobModel?> createJob({
    required String userId,
    required String serviceType,
    required String vehicleType,
    required String pickup,
    required String drop,
    GeoPoint? pickupGeoPoint,
    GeoPoint? dropGeoPoint,
    double? distanceKm,
    String? description,
    String? repairOption,
    String? garageId,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final job = await _jobService.createJob(
        userId: userId,
        serviceType: serviceType,
        vehicleType: vehicleType,
        pickup: pickup,
        drop: drop,
        pickupGeoPoint: pickupGeoPoint,
        dropGeoPoint: dropGeoPoint,
        distanceKm: distanceKm,
        description: description,
        repairOption: repairOption,
        garageId: garageId,
      );

      _currentJob = job;
      notifyListeners();

      // Automatically start streaming that job's status
      listenToJob(job.id);

      return job;
    } catch (e) {
      _setError('Failed to create job: $e');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  // ─── Stream Job Status ───────────────────────────────────────────────────────

  /// Listen to real-time updates for a job (the status screen).
  void listenToJob(String jobId) {
    _jobStatusSubscription?.cancel();
    _jobStatusSubscription = _jobService.streamJob(jobId).listen(
      (job) {
        _currentJob = job;
        notifyListeners();
      },
      onError: (e) => _setError('Job stream error: $e'),
    );
  }

  // ─── GET /jobs?userId= ───────────────────────────────────────────────────────

  /// Loads job history for a user.
  Future<void> loadUserJobHistory(String userId) async {
    _setLoading(true);
    _clearError();
    try {
      _userJobHistory = await _jobService.getJobsByUser(userId);
      notifyListeners();
    } catch (e) {
      _setError('Failed to load job history: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Real-time user job history. Call once and UI updates automatically.
  void listenToUserJobHistory(String userId) {
    _userHistorySubscription?.cancel();
    _userHistorySubscription = _jobService.streamJobsByUser(userId).listen(
      (jobs) {
        _userJobHistory = jobs;
        notifyListeners();
      },
      onError: (e) => _setError('History stream error: $e'),
    );
  }

  // ─── GET /jobs/available ─────────────────────────────────────────────────────

  /// Real-time stream of available jobs for a driver (Week 3).
  void listenToAvailableJobs(String driverVehicleType) {
    _availableJobsSubscription?.cancel();
    _availableJobsSubscription = _jobService
        .streamAvailableJobs(driverVehicleType)
        .listen(
          (jobs) {
            _availableJobs = jobs;
            notifyListeners();
          },
          onError: (e) => _setError('Available jobs stream error: $e'),
        );
  }

  // ─── PUT /jobs/:id/accept ────────────────────────────────────────────────────

  Future<bool> acceptJob({
    required String jobId,
    required String driverId,
  }) async {
    _setLoading(true);
    _clearError();
    try {
      await _jobService.acceptJob(jobId: jobId, driverId: driverId);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to accept job: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // ─── PUT /jobs/:id/status ────────────────────────────────────────────────────

  Future<bool> updateJobStatus(String jobId, String newStatus) async {
    _setLoading(true);
    _clearError();
    try {
      await _jobService.updateJobStatus(jobId, newStatus);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to update status: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> cancelJob(String jobId) async {
    return updateJobStatus(jobId, 'cancelled');
  }

  // ─── Clear Current Job ──────────────────────────────────────────────────────

  void clearCurrentJob() {
    _currentJob = null;
    _jobStatusSubscription?.cancel();
    notifyListeners();
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
    _jobStatusSubscription?.cancel();
    _availableJobsSubscription?.cancel();
    _userHistorySubscription?.cancel();
    super.dispose();
  }
}
