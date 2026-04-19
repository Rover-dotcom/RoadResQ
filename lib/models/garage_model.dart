import 'package:cloud_firestore/cloud_firestore.dart';

/// Represents a registered garage / repair shop.
class GarageModel {
  final String id;
  final String name;
  final String location;
  final GeoPoint? geoPoint;
  final String ownerUid;
  final String phone;
  final bool isVerified;
  final DateTime createdAt;

  GarageModel({
    required this.id,
    required this.name,
    required this.location,
    this.geoPoint,
    required this.ownerUid,
    required this.phone,
    this.isVerified = false,
    required this.createdAt,
  });

  factory GarageModel.fromMap(Map<String, dynamic> map, String id) {
    return GarageModel(
      id: id,
      name: map['name'] ?? '',
      location: map['location'] ?? '',
      geoPoint: map['geoPoint'] as GeoPoint?,
      ownerUid: map['ownerUid'] ?? '',
      phone: map['phone'] ?? '',
      isVerified: map['isVerified'] ?? false,
      createdAt: (map['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  factory GarageModel.fromDocument(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return GarageModel.fromMap(data, doc.id);
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'location': location,
      'geoPoint': geoPoint,
      'ownerUid': ownerUid,
      'phone': phone,
      'isVerified': isVerified,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  GarageModel copyWith({String? name, String? location, bool? isVerified}) {
    return GarageModel(
      id: id,
      name: name ?? this.name,
      location: location ?? this.location,
      geoPoint: geoPoint,
      ownerUid: ownerUid,
      phone: phone,
      isVerified: isVerified ?? this.isVerified,
      createdAt: createdAt,
    );
  }
}
