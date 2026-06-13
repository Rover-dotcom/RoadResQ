import 'package:flutter/material.dart';

class Header extends StatefulWidget {
  final String userName;
  final String selectedLangLabel;
  final VoidCallback onSettingsClick;
  final VoidCallback onLanguageClick;
  final VoidCallback onNotificationsClick;

  const Header({
    super.key,
    required this.userName,
    required this.selectedLangLabel,
    required this.onSettingsClick,
    required this.onLanguageClick,
    required this.onNotificationsClick,
  });

  @override
  State<Header> createState() => _HeaderState();
}

class _HeaderState extends State<Header> with TickerProviderStateMixin {
  late final AnimationController _fadeCtrl;
  late final AnimationController _badgeCtrl;
  late final Animation<double> _fadeAnim;
  late final Animation<double> _badgeAnim;

  @override
  void initState() {
    super.initState();

    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 500))
      ..forward();
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);

    _badgeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000))
      ..repeat(reverse: true);
    _badgeAnim = Tween<double>(begin: 0.35, end: 1.0)
        .animate(CurvedAnimation(parent: _badgeCtrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    _badgeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 12,
        bottom: 16,
        left: 16,
        right: 16,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF2563EB), Color(0xFF1E40AF)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
      ),
      child: FadeTransition(
        opacity: _fadeAnim,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // ── Left: menu + avatar + name ──
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.menu_rounded, color: Colors.white, size: 26),
                  onPressed: widget.onSettingsClick,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
                const SizedBox(width: 12),
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.35),
                      width: 1.5,
                    ),
                  ),
                  child: const Icon(Icons.person_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome back',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 11,
                      ),
                    ),
                    Text(
                      widget.userName,
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            // ── Right: language + notifications ──
            Row(
              children: [
                GestureDetector(
                  onTap: widget.onLanguageClick,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.language_rounded, color: Colors.white, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          widget.selectedLangLabel,
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.notifications_none_rounded, color: Colors.white, size: 26),
                      onPressed: widget.onNotificationsClick,
                      padding: const EdgeInsets.all(6),
                      constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                    ),
                    Positioned(
                      top: 6,
                      right: 6,
                      child: AnimatedBuilder(
                        animation: _badgeAnim,
                        builder: (_, __) => Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: Colors.red.withValues(alpha: _badgeAnim.value),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.red.withValues(alpha: _badgeAnim.value * 0.45),
                                blurRadius: 5,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}