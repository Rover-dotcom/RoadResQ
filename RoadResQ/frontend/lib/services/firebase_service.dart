import 'package:cloud_firestore/cloud_firestore.dart';

class FirebaseService {
  final _db = FirebaseFirestore.instance;

  Stream listenJobs() {
    return _db.collection("jobs").snapshots();
  }

  Future acceptJob(String jobId, String driverId) {
    return _db.collection("jobs").doc(jobId).update({
      "acceptedBy": driverId,
      "status": "accepted"
    });
  }
}
