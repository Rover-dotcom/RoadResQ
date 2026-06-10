import 'package:flutter/material.dart';

class EpodCloseoutScreen extends StatelessWidget {
  final VoidCallback onReset;

  const EpodCloseoutScreen({super.key, required this.onReset});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Spacer(),
          const Text('🏁', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          const Text('Manifest Completed Securely', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black)),
          const SizedBox(height: 8),
          const Text(
            'Electronic Proof of Delivery (ePOD) locked down. Site validation imagery compiled and payment metrics finalized.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey, fontSize: 14, height: 1.4),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            // FIX: Swapped out emerald shade references for material green shades
            decoration: BoxDecoration(
              color: Colors.green.shade50, 
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Tracking Token Manifest: #HT-4920-QA', 
              style: TextStyle(
                color: Colors.green.shade800, 
                fontWeight: FontWeight.bold, 
                fontSize: 13,
              ),
            ),
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: onReset,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
            ),
            child: const Text('Return to Control Dashboard', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}