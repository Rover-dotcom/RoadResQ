import 'package:cloud_firestore/cloud_firestore.dart';

/// Core Firestore CRUD wrapper for the RoadResQ backend.
///
/// This service provides low-level Firestore access.
/// Higher-level services (JobService, DriverService, etc.) use this.
class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // ─── Collection References ───────────────────────────────────────────────────

  CollectionReference get users => _db.collection('users');
  CollectionReference get drivers => _db.collection('drivers');
  CollectionReference get jobs => _db.collection('jobs');
  CollectionReference get garages => _db.collection('garages');
  CollectionReference get quoteRequests => _db.collection('quote_requests');

  // ─── Generic Helpers ─────────────────────────────────────────────────────────

  /// Creates a document in a collection. Returns the new document's ID.
  Future<String> create(
    CollectionReference ref,
    Map<String, dynamic> data,
  ) async {
    final doc = await ref.add(data);
    return doc.id;
  }

  /// Creates or overwrites a document with a known ID.
  Future<void> set(
    CollectionReference ref,
    String id,
    Map<String, dynamic> data, {
    bool merge = false,
  }) async {
    await ref.doc(id).set(data, SetOptions(merge: merge));
  }

  /// Reads a single document.
  Future<DocumentSnapshot> get(CollectionReference ref, String id) async {
    return ref.doc(id).get();
  }

  /// Updates specific fields in a document.
  Future<void> update(
    CollectionReference ref,
    String id,
    Map<String, dynamic> data,
  ) async {
    await ref.doc(id).update(data);
  }

  /// Deletes a document.
  Future<void> delete(CollectionReference ref, String id) async {
    await ref.doc(id).delete();
  }

  /// Returns a real-time stream of a single document.
  Stream<DocumentSnapshot> streamDocument(
    CollectionReference ref,
    String id,
  ) {
    return ref.doc(id).snapshots();
  }

  /// Returns a real-time stream of a query.
  Stream<QuerySnapshot> streamQuery(Query query) {
    return query.snapshots();
  }

  /// Executes a query and returns matching documents.
  Future<QuerySnapshot> query(Query q) async {
    return q.get();
  }

  // ─── Batch Writes ────────────────────────────────────────────────────────────

  /// Runs a batched write operation.
  /// Caller receives a WriteBatch to add operations to, then commits.
  Future<void> runBatch(
    Future<void> Function(WriteBatch batch) operations,
  ) async {
    final batch = _db.batch();
    await operations(batch);
    await batch.commit();
  }

  // ─── Server Timestamp ────────────────────────────────────────────────────────

  FieldValue get serverTimestamp => FieldValue.serverTimestamp();
}
