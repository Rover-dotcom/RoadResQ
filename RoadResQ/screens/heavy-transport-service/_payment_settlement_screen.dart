import 'package:flutter/material.dart';

class PaymentSettlementScreen extends StatelessWidget {
  final VoidCallback onContinue;
  final VoidCallback onBack;

  const PaymentSettlementScreen({super.key, required this.onContinue, required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Escrow Settlement Execution', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('Authorize secure fund allocation holds for transport tracking path execution.', style: TextStyle(fontSize: 14, color: Colors.grey)),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF013480), Color(0xFF0282dd)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  // FIX: Replaced deprecated .withOpacity with .withValues(alpha: ...) to comply with the latest Flutter API
                  color: const Color(0xFF013480).withValues(alpha: 0.2), 
                  blurRadius: 12, 
                  offset: const Offset(0, 6),
                )
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Corporate Line Credit Balance'.toUpperCase(), 
                  style: const TextStyle(color: Colors.white70, letterSpacing: 1.2, fontSize: 11, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                const Text('🎯 **** **** 8831', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                const SizedBox(height: 32),
                const Row(
                  // FIX: Changed from .between to .spaceBetween
                  mainAxisAlignment: MainAxisAlignment.spaceBetween, 
                  children: [
                    // FIX: Resolved 'whiteeef' typo to standard 'Colors.white70'
                    Text('Logistics Management System', style: TextStyle(color: Colors.white70, fontSize: 14)),
                    // FIX: Ensured clean Text styling without invalid constant weights
                    Text('QAR METRIC', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
                  ],
                )
              ],
            ),
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
            child: const Text('Authorize Escrow Allotment', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}