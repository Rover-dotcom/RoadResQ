import 'package:flutter/material.dart';

class TransitManifestScreen extends StatelessWidget {
  final VoidCallback onContinue;

  const TransitManifestScreen({super.key, required this.onContinue});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            // FIX: Changed from .between to .spaceBetween
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50, 
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'LIVE LOGISTICS TELEMETRY', 
                  style: TextStyle(color: Color(0xFF013480), fontWeight: FontWeight.bold, fontSize: 11),
                ),
              ),
              // FIX: Cleaned up Text style declaration to avoid compilation failure
              const Text(
                'ETA: 42 Mins', 
                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text('Active Transit Tracking', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('Heavy platform rig navigating target geofences.', style: TextStyle(fontSize: 14, color: Colors.grey)),
          const SizedBox(height: 20),
          Card(
            color: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16), 
              side: BorderSide(color: Colors.grey.shade100),
            ),
            child: const ListTile(
              leading: CircleAvatar(backgroundColor: Color(0xFFF3F4F6), child: Text('👨‍✈️')),
              title: Text('Captain J. Ahmed', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('Lowbed Identifier Vector: QA-LB-992'),
            ),
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: onContinue,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF22C55E),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
            ),
            child: const Text('Confirm Operational Offload Site Arrival', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}