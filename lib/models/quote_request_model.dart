import 'package:cloud_firestore/cloud_firestore.dart';

/// A quote request submitted by a customer for a heavy / special load job.
/// status: 'pending' | 'quoted' | 'accepted' | 'rejected'
class QuoteRequestModel {
  final String id;
  final String userId;
  final String description;
  final String itemType;
  final String pickup;
  final String drop;
  String status;
  double? quotedPrice;
  final DateTime createdAt;
  DateTime? respondedAt;

  QuoteRequestModel({
    required this.id,
    required this.userId,
    required this.description,
    required this.itemType,
    required this.pickup,
    required this.drop,
    this.status = 'pending',
    this.quotedPrice,
    required this.createdAt,
    this.respondedAt,
  });

  factory QuoteRequestModel.fromMap(Map<String, dynamic> map, String id) {
    return QuoteRequestModel(
      id: id,
      userId: map['userId'] ?? '',
      description: map['description'] ?? '',
      itemType: map['itemType'] ?? '',
      pickup: map['pickup'] ?? '',
      drop: map['drop'] ?? '',
      status: map['status'] ?? 'pending',
      quotedPrice: (map['quotedPrice'] as num?)?.toDouble(),
      createdAt: (map['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      respondedAt: (map['respondedAt'] as Timestamp?)?.toDate(),
    );
  }

  factory QuoteRequestModel.fromDocument(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return QuoteRequestModel.fromMap(data, doc.id);
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'description': description,
      'itemType': itemType,
      'pickup': pickup,
      'drop': drop,
      'status': status,
      'quotedPrice': quotedPrice,
      'createdAt': Timestamp.fromDate(createdAt),
      'respondedAt':
          respondedAt != null ? Timestamp.fromDate(respondedAt!) : null,
    };
  }
}
