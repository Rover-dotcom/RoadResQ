import 'package:flutter/material.dart';

class ServiceGrid extends StatefulWidget {
  final Function(int serviceId) onServiceClick;
  const ServiceGrid({super.key, required this.onServiceClick});

  @override
  State<ServiceGrid> createState() => _ServiceGridState();
}

class _ServiceGridState extends State<ServiceGrid> with TickerProviderStateMixin {
  late final List<AnimationController> _controllers;
  late final List<Animation<double>> _fades;
  late final List<Animation<Offset>> _slides;

  static final List<Map<String, dynamic>> _services = [
    {
      'id': 1,
      'title': 'Tow Service',
      'icon': Icons.local_shipping_rounded,
      'colors': [const Color(0xFF1E40AF), const Color(0xFF3B82F6)],
    },
    {
      'id': 2,
      'title': 'Mechanical Repair',
      'icon': Icons.build_rounded,
      'colors': [const Color(0xFFEA580C), const Color(0xFFF97316)],
    },
    {
      'id': 3,
      'title': 'Heavy Transport',
      'icon': Icons.commute_rounded,
      'colors': [const Color(0xFF15803D), const Color(0xFF22C55E)],
    },
    {
      'id': 4,
      'title': 'Inquiry (Industrial)',
      'icon': Icons.factory_rounded,
      'colors': [const Color(0xFF6B21A8), const Color(0xFF9333EA)],
    },
  ];

  @override
  void initState() {
    super.initState();

    _controllers = List.generate(
      _services.length,
      (_) => AnimationController(vsync: this, duration: const Duration(milliseconds: 480)),
    );

    _fades = _controllers
        .map((c) => CurvedAnimation(parent: c, curve: Curves.easeOut))
        .toList();

    _slides = _controllers
        .map((c) => Tween<Offset>(begin: const Offset(0, 0.28), end: Offset.zero)
            .animate(CurvedAnimation(parent: c, curve: Curves.easeOutCubic)))
        .toList();

    for (int i = 0; i < _controllers.length; i++) {
      Future.delayed(Duration(milliseconds: 80 + i * 90), () {
        if (mounted) _controllers[i].forward();
      });
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Our Logistics Services',
            style: TextStyle(
              fontFamily: 'Playfair Display',
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.2,
            ),
            itemCount: _services.length,
            itemBuilder: (context, index) {
              final item = _services[index];
              return FadeTransition(
                opacity: _fades[index],
                child: SlideTransition(
                  position: _slides[index],
                  child: _ServiceCard(
                    title: item['title'] as String,
                    icon: item['icon'] as IconData,
                    colors: item['colors'] as List<Color>,
                    onTap: () => widget.onServiceClick(item['id'] as int),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// INDIVIDUAL CARD — press-scale feedback
// ─────────────────────────────────────────────
class _ServiceCard extends StatefulWidget {
  final String title;
  final IconData icon;
  final List<Color> colors;
  final VoidCallback onTap;

  const _ServiceCard({
    required this.title,
    required this.icon,
    required this.colors,
    required this.onTap,
  });

  @override
  State<_ServiceCard> createState() => _ServiceCardState();
}

class _ServiceCardState extends State<_ServiceCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 110),
        curve: Curves.easeOut,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: widget.colors,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: widget.colors[0].withValues(alpha: 0.3),
                blurRadius: 14,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(widget.icon, color: Colors.white, size: 26),
              ),
              const SizedBox(height: 10),
              Text(
                widget.title,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}