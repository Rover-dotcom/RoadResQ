import 'package:flutter/material.dart';

class RepairStatusScreen extends StatelessWidget {
  final VoidCallback onJobCompletedMockTrigger;

  const RepairStatusScreen({Key? key, required this.onJobCompletedMockTrigger}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      body: Column(
        children: [
          Container(
            height: 128,
            width: double.infinity,
            decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)])),
            child: const Padding(
              padding: EdgeInsets.only(top: 68.0),
              child: Text(
                "Active Order Progress",
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w500, fontFamily: 'Inter'),
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const Text("Live Repair Lifecycle", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black, fontFamily: 'Inter')),
                const SizedBox(height: 24),
                _buildProgressTimelineItem("Vehicle Received", "Al Watan Workshop logged arrival at 10:14 AM", true, true),
                _buildProgressTimelineItem("Diagnostic Scan Running", "OBD instrumentation reading ongoing system error values", true, true),
                _buildProgressTimelineItem("Parts Replacement", "Replacing transmission solenoid pack valve assembly", false, true),
                _buildProgressTimelineItem("Quality Testing & Handoff", "Final multi-point safety validation clears build", false, false),
                const SizedBox(height: 40),
                ElevatedButton(
                  onPressed: onJobCompletedMockTrigger,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFF013480)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text("Simulate Completion Event", style: TextStyle(color: Color(0xFF013480))),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildProgressTimelineItem(String label, String context, bool isFinished, bool drawLine) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              height: 20,
              width: 20,
              decoration: BoxDecoration(
                color: isFinished ? const Color(0xFF0282DD) : Colors.white,
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF013480), width: 2),
              ),
              child: isFinished ? const Icon(Icons.check, size: 12, color: Colors.white) : null,
            ),
            if (drawLine) Container(height: 50, width: 2, color: isFinished ? const Color(0xFF0282DD) : const Color(0xFFE5E7EB)),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: isFinished ? Colors.black : Colors.black38, fontFamily: 'Inter')),
              const SizedBox(height: 4),
              Text(context, style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280), height: 1.3, fontFamily: 'Inter')),
            ],
          ),
        )
      ],
    );
  }
}