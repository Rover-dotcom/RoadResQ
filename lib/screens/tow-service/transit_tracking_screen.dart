import 'package:flutter/material.dart';

class TransitTrackingScreen extends StatelessWidget {
  final VoidCallback onJobCompleted;

  const TransitTrackingScreen({Key? key, required this.onJobCompleted}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          height: 128,
          width: double.infinity,
          decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)])),
          padding: const EdgeInsets.only(bottom: 20, left: 20),
          alignment: Alignment.bottomLeft,
          child: const Text('En-Route to Destination', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
        ),
        Expanded(
          child: Stack(
            children: [
              // Telematics Render Layout Placeholder
              Container(color: Colors.grey.shade200, child: const Center(child: Icon(Icons.local_shipping, size: 72, color: Colors.blue))),
              
              // Bottom Operator Information Board Container
              Positioned(
                bottom: 20,
                left: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)]),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          const CircleAvatar(radius: 24, backgroundColor: Colors.blueGrey, child: Icon(Icons.person, color: Colors.white)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text('Ahmed N. (En-Route)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                Text('Flatbed Carrier • Plate: 55432-QA', style: TextStyle(fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                          ),
                          IconButton(onPressed: () {}, icon: const Icon(Icons.phone, color: Colors.green))
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.red), foregroundColor: Colors.red),
                              onPressed: () {}, // Safety Panic Trigger
                              child: const Text('SOS / Cancel'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                              onPressed: onJobCompleted,
                              child: const Text('Confirm Offload'),
                            ),
                          ),
                        ],
                      )
                    ],
                  ),
                ),
              )
            ],
          ),
        )
      ],
    );
  }
}