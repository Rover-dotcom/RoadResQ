import 'package:flutter/material.dart';

class BiddingEngineScreen extends StatelessWidget {
  final VoidCallback onContinue;
  final VoidCallback onBack;

  const BiddingEngineScreen({super.key, required this.onContinue, required this.onBack});

  @override
  Widget build(BuildContext context) {
    final List<Map<String, String>> marketplaceBids = [
      {'company': 'Qatar Multi-Axle Fleet Line', 'price': '2,400 QAR', 'eta': '30m away'},
      {'company': 'Gulf Logistics Heavy Movers', 'price': '2,550 QAR', 'eta': '15m away'}
    ];

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Tender Bidding Pool', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('Select real-time structural tenders from available carriers.', style: TextStyle(fontSize: 14, color: Colors.grey)),
          const SizedBox(height: 24),
          Expanded(
            child: ListView.builder(
              itemCount: marketplaceBids.length,
              itemBuilder: (context, index) {
                final bid = marketplaceBids[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.02), 
                        blurRadius: 8, 
                        offset: const Offset(0, 2),
                      )
                    ],
                  ),
                  child: Row(
                    // FIX: Changed from .between to .spaceBetween
                    mainAxisAlignment: MainAxisAlignment.spaceBetween, 
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(bid['company']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          const SizedBox(height: 4),
                          Text('Positioning response: ${bid['eta']}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          // FIX: Cleaned up structure to strictly use FontWeight.w900 (Black)
                          Text(
                            bid['price']!, 
                            style: const TextStyle(
                              color: Color(0xFF013480), 
                              fontWeight: FontWeight.w900, 
                              fontSize: 18,
                            ),
                          ),
                          const SizedBox(height: 6),
                          ElevatedButton(
                            onPressed: onContinue,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0282dd),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                              minimumSize: const Size(60, 28),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                            ),
                            child: const Text('Accept', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          )
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}