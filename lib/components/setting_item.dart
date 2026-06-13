import 'package:flutter/material.dart';

class SettingItem extends StatefulWidget {
  final String icon;
  final String title;
  final String subtitle;
  final VoidCallback? onClick;

  const SettingItem({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onClick,
  });

  @override
  State<SettingItem> createState() => _SettingItemState();
}

class _SettingItemState extends State<SettingItem> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeInOut,
        transform: _isHovered ? (Matrix4.identity()..translate(2, 0, 0)) : Matrix4.identity(),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: _isHovered ? Colors.grey[50] : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: ListTile(
          onTap: widget.onClick,
          leading: Text(widget.icon, style: const TextStyle(fontSize: 20)),
          title: Text(
            widget.title,
            style: const TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF111827)),
          ),
          subtitle: Text(
            widget.subtitle,
            style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF6B7280)),
          ),
          trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
        ),
      ),
    );
  }
}