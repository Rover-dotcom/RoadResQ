import 'package:flutter/material.dart';

class ScheduleTimeScreen extends StatefulWidget {
  final Function(String) onContinue;
  final VoidCallback onBack;

  const ScheduleTimeScreen({super.key, required this.onContinue, required this.onBack});

  @override
  State<ScheduleTimeScreen> createState() => _ScheduleTimeScreenState();
}

class _ScheduleTimeScreenState extends State<ScheduleTimeScreen> {
  String selectedType = 'now';

  Widget _buildOption(String type, String title, String subtitle, String emoji) {
    final isSelected = selectedType == type;
    return GestureDetector(
      onTap: () => setState(() => selectedType = type),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? const Color(0xFF013480) : Colors.grey.shade200, width: 2),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 13, color: Colors.grey)),
                ],
              ),
            ),
            Text(emoji, style: const TextStyle(fontSize: 24)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Deployment Protocol', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('Choose instant dispatch or advance structural scheduling.', style: TextStyle(fontSize: 14, color: Colors.grey)),
          const SizedBox(height: 24),
          _buildOption('now', 'Now', 'Deploy the nearest flatbed asset pool immediately.', '🚚'),
          const SizedBox(height: 14),
          _buildOption('schedule', 'Schedule Logistics Window', 'Lock custom future reservation grids.', '📅'),
          const Spacer(),
          ElevatedButton(
            onPressed: () => widget.onContinue(selectedType),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF013480),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
            ),
            child: const Text('Confirm Dispatch Method', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}