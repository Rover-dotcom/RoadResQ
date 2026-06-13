import 'dart:async';
import 'package:flutter/material.dart';
import 'package:road_resq/models/quote_request_model.dart';
import 'package:road_resq/services/quote_service.dart';

/// Quote Provider — wraps QuoteService for reactive UI state.
///
/// Used by:
///   - Industrial inquiry wizard
///   - Admin quote management
class QuoteProvider extends ChangeNotifier {
  final QuoteService _quoteService = QuoteService();

  // ─── State ───────────────────────────────────────────────────────────────────

  bool _isLoading = false;
  String? _errorMessage;
  List<QuoteRequestModel> _userQuotes = [];
  List<QuoteRequestModel> _allQuotes = [];
  QuoteRequestModel? _currentQuote;

  StreamSubscription<List<QuoteRequestModel>>? _quotesSubscription;

  // ─── Getters ─────────────────────────────────────────────────────────────────

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  List<QuoteRequestModel> get userQuotes => _userQuotes;
  List<QuoteRequestModel> get allQuotes => _allQuotes;
  QuoteRequestModel? get currentQuote => _currentQuote;

  // ─── Submit Quote Request ─────────────────────────────────────────────────────

  Future<QuoteRequestModel?> submitQuoteRequest({
    required String userId,
    required String itemType,
    required String description,
    required String pickup,
    required String drop,
  }) async {
    _setLoading(true);
    _clearError();
    try {
      final quote = await _quoteService.submitQuoteRequest(
        userId: userId,
        itemType: itemType,
        description: description,
        pickup: pickup,
        drop: drop,
      );
      _currentQuote = quote;
      notifyListeners();
      return quote;
    } catch (e) {
      _setError('Failed to submit quote: $e');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  // ─── Load User Quotes ─────────────────────────────────────────────────────────

  Future<void> loadUserQuotes(String userId) async {
    _setLoading(true);
    _clearError();
    try {
      _userQuotes = await _quoteService.getQuotesByUser(userId);
      notifyListeners();
    } catch (e) {
      _setError('Failed to load quotes: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Real-time stream of quotes for a user.
  void listenToUserQuotes(String userId) {
    _quotesSubscription?.cancel();
    _quotesSubscription = _quoteService.streamQuotesByUser(userId).listen(
      (quotes) {
        _userQuotes = quotes;
        notifyListeners();
      },
      onError: (e) => _setError('Quotes stream error: $e'),
    );
  }

  // ─── Admin: Load All + Respond ────────────────────────────────────────────────

  Future<void> loadAllQuotes() async {
    _setLoading(true);
    _clearError();
    try {
      _allQuotes = await _quoteService.getQuoteRequests();
      notifyListeners();
    } catch (e) {
      _setError('Failed to load all quotes: $e');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> respondToQuote({
    required String quoteId,
    required double quotedPrice,
  }) async {
    try {
      await _quoteService.respondToQuote(
        quoteId: quoteId,
        quotedPrice: quotedPrice,
      );
      await loadAllQuotes();
    } catch (e) {
      _setError('Failed to respond to quote: $e');
    }
  }

  // ─── Customer: Accept/Reject ──────────────────────────────────────────────────

  Future<void> acceptQuote(String quoteId) async {
    try {
      await _quoteService.acceptQuote(quoteId);
    } catch (e) {
      _setError('Failed to accept quote: $e');
    }
  }

  Future<void> rejectQuote(String quoteId) async {
    try {
      await _quoteService.rejectQuote(quoteId);
    } catch (e) {
      _setError('Failed to reject quote: $e');
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
    _quotesSubscription?.cancel();
    super.dispose();
  }
}
