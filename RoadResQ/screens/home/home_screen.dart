import 'package:flutter/material.dart';
import 'dart:async';
import 'widgets/header.dart';
import 'widgets/location_card.dart';
import 'widgets/news_ticker.dart';
import 'widgets/service_grid.dart';
import 'widgets/promo_code_section.dart';
import 'widgets/settings_sidebar.dart';
import 'widgets/language_modal.dart';
import 'widgets/notifications_modal.dart';

class HomeScreen extends StatefulWidget {
  final String userName;
  final VoidCallback onLogout;
  final Function(int serviceId) onServiceSelect;

  const HomeScreen({
    super.key,
    required this.userName,
    required this.onLogout,
    required this.onServiceSelect,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  String _currentLanguage = 'En';
  String _promoCode = '';
  int _currentNewsIndex = 0;
  Timer? _newsTimer;

  late final AnimationController _entranceController;
  late final Animation<double> _entranceFade;
  late final Animation<Offset> _entranceSlide;

  final bool _hasActiveService = true;
  final String _activeServiceName = "Flatbed Tow Rescue — Mesaieed Route";
  final String _activeServiceStatus = "Driver en route (ETA 12 mins)";

  final List<String> _newsItems = [
    "Mesaieed Route clear: Automated dynamic pricing active.",
    "Specialized heavy equipment flatbeds deployed near Sealine.",
    "Up to 15% off off-road rescues this weekend using promo code.",
  ];

  @override
  void initState() {
    super.initState();

    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    )..forward();

    _entranceFade = CurvedAnimation(parent: _entranceController, curve: Curves.easeOut);
    _entranceSlide = Tween<Offset>(
      begin: const Offset(0, 0.04),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _entranceController, curve: Curves.easeOutCubic));

    _newsTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (mounted) {
        setState(() => _currentNewsIndex = (_currentNewsIndex + 1) % _newsItems.length);
      }
    });
  }

  @override
  void dispose() {
    _entranceController.dispose();
    _newsTimer?.cancel();
    super.dispose();
  }

  void _openLanguagePicker() {
    showDialog(
      context: context,
      builder: (context) => LanguageModal(
        selectedLanguage: _currentLanguage,
        languages: const ['En', 'العربية', 'Fr'],
        onSelectLanguage: (lang) => setState(() => _currentLanguage = lang),
      ),
    );
  }

  void _openNotifications() {
    showDialog(
      context: context,
      builder: (context) => const NotificationsModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: Colors.grey[50],
      drawer: SettingsSidebar(
        userName: widget.userName,
        onLogout: widget.onLogout,
        userLocation: 'Mesaieed',
      ),
      body: Column(
        children: [
          Header(
            userName: widget.userName,
            selectedLangLabel: _currentLanguage,
            onSettingsClick: () => _scaffoldKey.currentState?.openDrawer(),
            onLanguageClick: _openLanguagePicker,
            onNotificationsClick: _openNotifications,
          ),
          Expanded(
            child: FadeTransition(
              opacity: _entranceFade,
              child: SlideTransition(
                position: _entranceSlide,
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const LocationCard(location: "Mesaieed Industrial District, QA"),
                      const SizedBox(height: 16),
                      ServiceGrid(onServiceClick: widget.onServiceSelect),
                      _buildActiveServicesSection(),
                      NewsTicker(currentIndex: _currentNewsIndex, newsItems: _newsItems),
                      PromoCodeSection(
                        promoCode: _promoCode,
                        onPromoCodeChange: (val) => setState(() => _promoCode = val),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveServicesSection() {
    return AnimatedSize(
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOutCubic,
      child: _hasActiveService
          ? Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const _PulsingDot(),
                      const SizedBox(width: 8),
                      const Text(
                        'Active Request',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF111827),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFF1E40AF).withValues(alpha: 0.15),
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E40AF).withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.local_shipping_rounded,
                            color: Color(0xFF1E40AF),
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _activeServiceName,
                                style: const TextStyle(
                                  fontFamily: 'Inter',
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF1F2937),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const _PulsingDot(size: 6),
                                  const SizedBox(width: 5),
                                  Text(
                                    _activeServiceStatus,
                                    style: const TextStyle(
                                      fontFamily: 'Inter',
                                      fontSize: 12,
                                      color: Color(0xFF2563EB),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.grey),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            )
          : const SizedBox.shrink(),
    );
  }
}

// ─────────────────────────────────────────────
// REUSABLE PULSING DOT — live / active indicator
// ─────────────────────────────────────────────
class _PulsingDot extends StatefulWidget {
  final Color color;
  final double size;

  const _PulsingDot({
    this.color = const Color(0xFF2563EB),
    this.size = 8.0,
  });

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.3, end: 1.0)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(
          color: widget.color.withValues(alpha: _anim.value),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: widget.color.withValues(alpha: _anim.value * 0.45),
              blurRadius: 5,
              spreadRadius: 1,
            ),
          ],
        ),
      ),
    );
  }
}