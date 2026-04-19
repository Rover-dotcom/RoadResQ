import 'package:cloud_firestore/cloud_firestore.dart';

/// Represents a registered driver in RoadResQ.
/// vehicleType examples: 'Sedan', 'SUV', '4x4', 'Motorcycle', 'ATV',
///                       'Precast Block', 'Pallets/Bricks', 'Container', 'Generator'
class DriverModel {
  final String uid;
  final String name;
  final String email;
  final String phone;
  final String vehicleType;
  final String licenseNumber;
  final bool isOnline;
  final bool isApproved;
  final GeoPoint? lastLocation;
  final String experience; // e.g. "3 years"
  final DateTime createdAt;

  DriverModel({
    required this.uid,
    required this.name,
    required this.email,
    required this.phone,
    required this.vehicleType,
    required this.licenseNumber,
    this.isOnline = false,
    this.isApproved = false,
    this.lastLocation,
    this.experience = '',
    required this.createdAt,
  });

  factory DriverModel.fromMap(Map<String, dynamic> map, String uid) {
    return DriverModel(
      uid: uid,
      name: map['name'] ?? '',
      email: map['email'] ?? '',
      phone: map['phone'] ?? '',
      vehicleType: map['vehicleType'] ?? '',
      licenseNumber: map['licenseNumber'] ?? '',
      isOnline: map['isOnline'] ?? false,
      isApproved: map['isApproved'] ?? false,
      lastLocation: map['lastLocation'] as GeoPoint?,
      experience: map['experience'] ?? '',
      createdAt: (map['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  factory DriverModel.fromDocument(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return DriverModel.fromMap(data, doc.id);
  }

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'name': name,
      'email': email,
      'phone': phone,
      'vehicleType': vehicleType,
      'licenseNumber': licenseNumber,
      'isOnline': isOnline,
      'isApproved': isApproved,
      'lastLocation': lastLocation,
      'experience': experience,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  DriverModel copyWith({
    String? name,
    String? vehicleType,
    String? licenseNumber,
    bool? isOnline,
    bool? isApproved,
    GeoPoint? lastLocation,
    String? experience,
  }) {
    return DriverModel(
      uid: uid,
      name: name ?? this.name,
      email: email,
      phone: phone,
      vehicleType: vehicleType ?? this.vehicleType,
      licenseNumber: licenseNumber ?? this.licenseNumber,
      isOnline: isOnline ?? this.isOnline,
      isApproved: isApproved ?? this.isApproved,
      lastLocation: lastLocation ?? this.lastLocation,
      experience: experience ?? this.experience,
      createdAt: createdAt,
    );
  }
}
