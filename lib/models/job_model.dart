import 'package:cloud_firestore/cloud_firestore.dart';

/// Job status progression:
/// pending → accepted → in_progress → at_garage → completed | cancelled
class JobModel {
  final String id;
  final String userId;
  String? driverId;
  String? garageId;

  // Service details
  final String serviceType; // 'tow', 'repair', 'heavy', 'quote'
  final String vehicleType; // e.g. 'Sedan', 'ATV', 'Container'
  final String category;    // auto-detected: 'leisure' or 'heavy'

  // Locations
  final String pickup;
  final String drop;
  final GeoPoint? pickupGeoPoint;
  final GeoPoint? dropGeoPoint;

  // Pricing
  final double price;
  final double? distanceKm;

  // Status
  String status; // pending | accepted | in_progress | at_garage | completed | cancelled

  // Timestamps
  final DateTime createdAt;
  DateTime? acceptedAt;
  DateTime? completedAt;

  // Extra
  final String? description; // for heavy/quote jobs
  final String? repairOption; // 'on_site' | 'garage'

  JobModel({
    required this.id,
    required this.userId,
    this.driverId,
    this.garageId,
    required this.serviceType,
    required this.vehicleType,
    required this.category,
    required this.pickup,
    required this.drop,
    this.pickupGeoPoint,
    this.dropGeoPoint,
    required this.price,
    this.distanceKm,
    this.status = 'pending',
    required this.createdAt,
    this.acceptedAt,
    this.completedAt,
    this.description,
    this.repairOption,
  });

  factory JobModel.fromMap(Map<String, dynamic> map, String id) {
    return JobModel(
      id: id,
      userId: map['userId'] ?? '',
      driverId: map['driverId'],
      garageId: map['garageId'],
      serviceType: map['serviceType'] ?? '',
      vehicleType: map['vehicleType'] ?? '',
      category: map['category'] ?? 'leisure',
      pickup: map['pickup'] ?? '',
      drop: map['drop'] ?? '',
      pickupGeoPoint: map['pickupGeoPoint'] as GeoPoint?,
      dropGeoPoint: map['dropGeoPoint'] as GeoPoint?,
      price: (map['price'] as num?)?.toDouble() ?? 0.0,
      distanceKm: (map['distanceKm'] as num?)?.toDouble(),
      status: map['status'] ?? 'pending',
      createdAt: (map['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      acceptedAt: (map['acceptedAt'] as Timestamp?)?.toDate(),
      completedAt: (map['completedAt'] as Timestamp?)?.toDate(),
      description: map['description'],
      repairOption: map['repairOption'],
    );
  }

  factory JobModel.fromDocument(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return JobModel.fromMap(data, doc.id);
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'driverId': driverId,
      'garageId': garageId,
      'serviceType': serviceType,
      'vehicleType': vehicleType,
      'category': category,
      'pickup': pickup,
      'drop': drop,
      'pickupGeoPoint': pickupGeoPoint,
      'dropGeoPoint': dropGeoPoint,
      'price': price,
      'distanceKm': distanceKm,
      'status': status,
      'createdAt': Timestamp.fromDate(createdAt),
      'acceptedAt': acceptedAt != null ? Timestamp.fromDate(acceptedAt!) : null,
      'completedAt':
          completedAt != null ? Timestamp.fromDate(completedAt!) : null,
      'description': description,
      'repairOption': repairOption,
    };
  }

  bool get isPending => status == 'pending';
  bool get isAccepted => status == 'accepted';
  bool get isInProgress => status == 'in_progress';
  bool get isAtGarage => status == 'at_garage';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'in_progress':
        return 'In Progress';
      case 'at_garage':
        return 'At Garage';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }
}
