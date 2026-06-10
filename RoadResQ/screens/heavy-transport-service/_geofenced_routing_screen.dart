import 'package:flutter/material.dart';

class GeofencedRoutingScreen extends StatelessWidget {
  final VoidCallback onContinue;
  final VoidCallback onBack;

  const GeofencedRoutingScreen({super.key, required this.onContinue, required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Geofenced Node Routes', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('Route mapping calibrated for deep industrial hubs.', style: TextStyle(fontSize: 14, color: Colors.grey)),
          const SizedBox(height: 24),
          TextField(
            decoration: InputDecoration(
              hintText: '📍 Origin: Mesaieed Industrial Area Sector 3',
              filled: true,
              fillColor: Colors.white,
              hintStyle: const TextStyle(color: Colors.black87, fontWeight: FontWeight.w500),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            ),
            readOnly: true,
          ),
          const SizedBox(height: 14),
          TextField(
            decoration: InputDecoration(
              hintText: '🏁 Hub Destination: Ras Laffan Projects Gate 7',
              filled: true,
              fillColor: Colors.white,
              hintStyle: const TextStyle(color: Colors.black87, fontWeight: FontWeight.w500),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            ),
            readOnly: true,
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: onContinue,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF013480),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
            ),
            child: const Text('Calculate Freight Vectors', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}