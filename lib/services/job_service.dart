import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:road_resq/models/job_model.dart';
import 'package:road_resq/services/firestore_service.dart';
import 'package:road_resq/utils/category_engine.dart';
import 'package:uuid/uuid.dart';

/// Job Service — Weeks 2 + 3
///
/// APIs implemented:
///   POST   /jobs               → createJob()
///   GET    /jobs               → getJobs()
///   GET    /jobs?userId=       → getJobsByUser()
///   GET    /jobs?driverId=     → getJobsByDriver()
///   GET    /jobs/available     → getAvailableJobs()
///   PUT    /jobs/:id/accept    → acceptJob()
///   PUT    /jobs/:id/status    → updateJobStatus()
///   Stream /jobs/:id           → streamJob()
class JobService {
  final FirestoreService _fs = FirestoreService();
  final Uuid _uuid = const Uuid();

  // ─── Constants (Week 3 spec) ─────────────────────────────────────────────────

  static const double _defaultDistanceKm = 5.0; // fallback if no GPS

  // ─── POST /jobs ──────────────────────────────────────────────────────────────

  /// Creates a new job in Firestore.
  ///
  /// Auto-detects category, calculates price, sets status to 'pending'.
  /// Returns the saved [JobModel].
  Future<JobModel> createJob({
    required String userId,
    required String serviceType, // 'tow' | 'repair' | 'heavy' | 'quote'
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
    // Week 3: auto-detect category
    final category = CategoryEngine.getCategory(vehicleType);

    // Week 3: calculate price (base=250, perKm=5, heavy=1.5x)
    final km = distanceKm ?? _defaultDistanceKm;
    final price = CategoryEngine.calculatePrice(
      vehicleType: vehicleType,
      distanceKm: km,
    );

    final id = _uuid.v4();

    final job = JobModel(
      id: id,
      userId: userId,
      serviceType: serviceType,
      vehicleType: vehicleType,
      category: category,
      pickup: pickup,
      drop: drop,
      pickupGeoPoint: pickupGeoPoint,
      dropGeoPoint: dropGeoPoint,
      price: price,
      distanceKm: km,
      status: 'pending',
      createdAt: DateTime.now(),
      description: description,
      repairOption: repairOption,
      garageId: garageId,
    );

    await _fs.set(_fs.jobs, id, job.toMap());

    return job;
  }

  // ─── GET /jobs ───────────────────────────────────────────────────────────────

  /// Returns ALL jobs (admin use).
  Future<List<JobModel>> getJobs() async {
    final snapshot = await _fs.jobs.orderBy('createdAt', descending: true).get();
    return snapshot.docs
        .map((doc) => JobModel.fromDocument(doc))
        .toList();
  }

  // ─── GET /jobs?userId= ───────────────────────────────────────────────────────

  /// Returns all jobs for a specific customer (job history).
  Future<List<JobModel>> getJobsByUser(String userId) async {
    final snapshot = await _fs.jobs
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .get();
    return snapshot.docs.map((doc) => JobModel.fromDocument(doc)).toList();
  }

  // ─── GET /jobs?driverId= ─────────────────────────────────────────────────────

  /// Returns all jobs assigned to a specific driver.
  Future<List<JobModel>> getJobsByDriver(String driverId) async {
    final snapshot = await _fs.jobs
        .where('driverId', isEqualTo: driverId)
        .orderBy('createdAt', descending: true)
        .get();
    return snapshot.docs.map((doc) => JobModel.fromDocument(doc)).toList();
  }

  // ─── GET /jobs/available ─────────────────────────────────────────────────────

  /// Returns jobs that are pending AND match the driver's vehicle type.
  ///
  /// Week 3 driver filtering:
  ///   - status == 'pending'
  ///   - vehicleType == driverVehicleType
  ///
  /// Note: isOnline + isApproved is enforced on the driver side (DriverService).
  Future<List<JobModel>> getAvailableJobs(String driverVehicleType) async {
    final snapshot = await _fs.jobs
        .where('status', isEqualTo: 'pending')
        .where('vehicleType', isEqualTo: driverVehicleType)
        .orderBy('createdAt', descending: false)
        .get();
    return snapshot.docs.map((doc) => JobModel.fromDocument(doc)).toList();
  }

  // ─── Stream /jobs/:id ────────────────────────────────────────────────────────

  /// Real-time stream of a single job — used for job status tracking screen.
  Stream<JobModel?> streamJob(String jobId) {
    return _fs.jobs.doc(jobId).snapshots().map((doc) {
      if (!doc.exists) return null;
      return JobModel.fromDocument(doc);
    });
  }

  /// Real-time stream of all pending jobs matching a vehicle type.
  Stream<List<JobModel>> streamAvailableJobs(String driverVehicleType) {
    return _fs.jobs
        .where('status', isEqualTo: 'pending')
        .where('vehicleType', isEqualTo: driverVehicleType)
        .snapshots()
        .map(
          (snapshot) =>
              snapshot.docs.map((doc) => JobModel.fromDocument(doc)).toList(),
        );
  }

  /// Real-time stream of all jobs for a user.
  Stream<List<JobModel>> streamJobsByUser(String userId) {
    return _fs.jobs
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map(
          (snapshot) =>
              snapshot.docs.map((doc) => JobModel.fromDocument(doc)).toList(),
        );
  }

  // ─── PUT /jobs/:id/accept ────────────────────────────────────────────────────

  /// Driver accepts a pending job.
  ///
  /// Updates:
  ///   - status → 'accepted'
  ///   - driverId → driver's uid
  ///   - acceptedAt → now
  Future<void> acceptJob({
    required String jobId,
    required String driverId,
  }) async {
    await _fs.update(_fs.jobs, jobId, {
      'status': 'accepted',
      'driverId': driverId,
      'acceptedAt': FieldValue.serverTimestamp(),
    });
  }

  // ─── PUT /jobs/:id/status ────────────────────────────────────────────────────

  /// Updates the job status to any valid state.
  /// Valid states: pending | accepted | in_progress | at_garage | completed | cancelled
  Future<void> updateJobStatus(String jobId, String newStatus) async {
    final updates = <String, dynamic>{'status': newStatus};

    if (newStatus == 'completed') {
      updates['completedAt'] = FieldValue.serverTimestamp();
    }

    await _fs.update(_fs.jobs, jobId, updates);
  }

  // ─── Garage receives job ─────────────────────────────────────────────────────

  /// Returns real-time stream of jobs assigned to a specific garage.
  Stream<List<JobModel>> streamJobsForGarage(String garageId) {
    return _fs.jobs
        .where('garageId', isEqualTo: garageId)
        .where('status', whereIn: ['accepted', 'in_progress', 'at_garage'])
        .snapshots()
        .map(
          (snapshot) =>
              snapshot.docs.map((doc) => JobModel.fromDocument(doc)).toList(),
        );
  }

  // ─── Cancel Job ──────────────────────────────────────────────────────────────

  Future<void> cancelJob(String jobId) async {
    await updateJobStatus(jobId, 'cancelled');
  }

  // ─── Standardized response format ────────────────────────────────────────────

  /// Wraps a result in the standard API response format:
  /// { "status": "success", "data": ... }
  static Map<String, dynamic> successResponse(dynamic data) {
    return {'status': 'success', 'data': data};
  }

  static Map<String, dynamic> errorResponse(String message) {
    return {'status': 'error', 'message': message};
  }
}
