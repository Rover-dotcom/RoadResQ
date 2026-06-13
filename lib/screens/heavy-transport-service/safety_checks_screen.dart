import 'package:flutter/material.dart';

class SafetyChecksScreen extends StatefulWidget {
  final VoidCallback onContinue;
  final VoidCallback onBack;

  const SafetyChecksScreen({super.key, required this.onContinue, required this.onBack});

  @override
  State<SafetyChecksScreen> createState() => _SafetyChecksScreenState();
}

class _SafetyChecksScreenState extends State<SafetyChecksScreen> {
  bool runsAndDrives = true;
  bool boomSecured = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Rigging & Safety Checks', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black)),
          const SizedBox(height: 4),
          const Text('Declare physical mechanics for configuration rules.', style: TextStyle(fontSize: 14, color: Colors.grey)),
          const SizedBox(height: 24),
          SwitchListTile.adaptive(
            title: const Text('Asset Runs & Drives', style: TextStyle(fontWeight: FontWeight.bold)),
            subtitle: const Text('Requires winch system alignment if immobilized.'),
            value: runsAndDrives,
            // ignore: deprecated_member_use
            activeColor: const Color(0xFF013480),
            onChanged: (val) => setState(() => runsAndDrives = val),
          ),
          const Divider(),
          SwitchListTile.adaptive(
            title: const Text('Boom Disassembled', style: TextStyle(fontWeight: FontWeight.bold)),
            subtitle: const Text('Mandatory validation for regulatory clearance.'),
            value: boomSecured,
            // ignore: deprecated_member_use
            activeColor: const Color(0xFF013480),
            onChanged: (val) => setState(() => boomSecured = val),
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: widget.onContinue,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF013480),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
            ),
            child: const Text('Verify Logistics Rules', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}