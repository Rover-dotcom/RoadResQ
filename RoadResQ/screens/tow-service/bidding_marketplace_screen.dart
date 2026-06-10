import 'package:flutter/material.dart';
import 'package:road_resq/features/tow_booking/widgets/tow_flow_helpers.dart';

class BiddingMarketplaceScreen extends StatefulWidget {
  final VoidCallback onBack;
  final Function(String, double) onConfirmedBid;

  const BiddingMarketplaceScreen({Key? key, required this.onBack, required this.onConfirmedBid}) : super(key: key);

  @override
  State<BiddingMarketplaceScreen> createState() => _BiddingMarketplaceScreenState();
}

class _BiddingMarketplaceScreenState extends State<BiddingMarketplaceScreen> {
  final List<Map<String, dynamic>> _mockBids = [
    {'driver': 'Ahmed N.', 'rating': '4.9', 'tow_type': 'Flatbed Truck', 'eta': '12 mins', 'bid': 250.0},
    {'driver': 'Suresh Kumar', 'rating': '4.7', 'tow_type': 'Boom Truck Winch', 'eta': '8 mins', 'bid': 300.0},
    {'driver': 'Ali Al-Thani', 'rating': '5.0', 'tow_type': 'Heavy Duty Tow', 'eta': '20 mins', 'bid': 220.0},
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        buildWizardHeader(title: 'Safety & Site Access', onBack: widget.onBack),
buildProgressIndicator(value: 0.14, label: 'Step 1/7'),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: const [
              SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF013480))),
              SizedBox(width: 12),
              Text('Receiving live bids from operators...', style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _mockBids.length,
            itemBuilder: (context, index) {
              final bid = _mockBids[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(bid['driver'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(height: 4),
                        Text('${bid['tow_type']} • ⭐️ ${bid['rating']}', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                        Text('Arrival Time Estimate: ${bid['eta']}', style: const TextStyle(color: Colors.orange, fontSize: 12, fontWeight: FontWeight.w500)),
                      ],
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF013480),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                      ),
                      onPressed: () => widget.onConfirmedBid(bid['driver'], bid['bid']),
                      child: Text('${bid['bid'].toStringAsFixed(0)} QAR', style: const TextStyle(color: Colors.white)),
                    )
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}