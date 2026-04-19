import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:road_resq/models/quote_request_model.dart';
import 'package:road_resq/services/firestore_service.dart';
import 'package:uuid/uuid.dart';

/// Quote Request Service — Week 3
///
/// APIs implemented:
///   POST  /quote-request         → submitQuoteRequest()
///   GET   /quote-requests        → getQuoteRequests() (admin)
///   GET   /quote-requests?userId= → getQuotesByUser()
///   PUT   /quote-requests/:id/respond → respondToQuote() (admin)
class QuoteService {
  final FirestoreService _fs = FirestoreService();
  final Uuid _uuid = const Uuid();

  // ─── POST /quote-request ─────────────────────────────────────────────────────

  /// Customer submits a quote request for heavy/special load jobs.
  Future<QuoteRequestModel> submitQuoteRequest({
    required String userId,
    required String itemType,
    required String description,
    required String pickup,
    required String drop,
  }) async {
    final id = _uuid.v4();
    final quote = QuoteRequestModel(
      id: id,
      userId: userId,
      description: description.trim(),
      itemType: itemType.trim(),
      pickup: pickup.trim(),
      drop: drop.trim(),
      status: 'pending',
      createdAt: DateTime.now(),
    );

    await _fs.set(_fs.quoteRequests, id, quote.toMap());
    return quote;
  }

  // ─── GET /quote-requests (admin) ─────────────────────────────────────────────

  Future<List<QuoteRequestModel>> getQuoteRequests() async {
    final snapshot = await _fs.quoteRequests
        .orderBy('createdAt', descending: true)
        .get();
    return snapshot.docs
        .map((doc) => QuoteRequestModel.fromDocument(doc))
        .toList();
  }

  // ─── GET /quote-requests?userId= ────────────────────────────────────────────

  Future<List<QuoteRequestModel>> getQuotesByUser(String userId) async {
    final snapshot = await _fs.quoteRequests
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .get();
    return snapshot.docs
        .map((doc) => QuoteRequestModel.fromDocument(doc))
        .toList();
  }

  // ─── Real-time stream ────────────────────────────────────────────────────────

  Stream<List<QuoteRequestModel>> streamQuotesByUser(String userId) {
    return _fs.quoteRequests
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => QuoteRequestModel.fromDocument(doc))
              .toList(),
        );
  }

  Stream<List<QuoteRequestModel>> streamAllQuotes() {
    return _fs.quoteRequests
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => QuoteRequestModel.fromDocument(doc))
              .toList(),
        );
  }

  // ─── PUT /quote-requests/:id/respond (admin) ──────────────────────────────────

  /// Admin responds to a quote with a price and changes status to 'quoted'.
  Future<void> respondToQuote({
    required String quoteId,
    required double quotedPrice,
  }) async {
    await _fs.update(_fs.quoteRequests, quoteId, {
      'quotedPrice': quotedPrice,
      'status': 'quoted',
      'respondedAt': FieldValue.serverTimestamp(),
    });
  }

  // ─── Customer accepts a quoted price ─────────────────────────────────────────

  Future<void> acceptQuote(String quoteId) async {
    await _fs.update(_fs.quoteRequests, quoteId, {'status': 'accepted'});
  }

  Future<void> rejectQuote(String quoteId) async {
    await _fs.update(_fs.quoteRequests, quoteId, {'status': 'rejected'});
  }
}
