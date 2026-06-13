import 'package:flutter/material.dart';

class DriverAssignedScreen extends StatelessWidget {
  final VoidCallback onTrackProgress;

  const DriverAssignedScreen({Key? key, required this.onTrackProgress}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      body: Stack(
        children: [
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              // Dynamic Status Graphic Layer placeholder
              Center(
                child: Container(
                  height: 120,
                  width: 120,
                  decoration: BoxDecoration(color: const Color(0xFF013480).withOpacity(0.1), shape: BoxShape.circle),
                  child: const Icon(Icons.local_shipping, size: 54, color: Color(0xFF0282DD)),
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                "Driver Assigned",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black, fontFamily: 'Inter'),
              ),
              const SizedBox(height: 8),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 40.0),
                child: Text(
                  "Recovery vehicle operator Tariq Ahmed is tracking towards your logged GPS location.",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: Color(0xFF6B7280), height: 1.4, fontFamily: 'Inter'),
                ),
              ),
              const SizedBox(height: 40),
              // Compact Operator Card
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 24),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3))],
                ),
                child: Row(
                  children: [
                    Container(
                      height: 48,
                      width: 48,
                      decoration: const BoxDecoration(color: Color(0xFFE5E7EB), shape: BoxShape.circle),
                      child: const Icon(Icons.person, color: Colors.black45),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text("Tariq Ahmed", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Inter')),
                          SizedBox(height: 2),
                          Text("GMC Savana flatbed • Plate 442911", style: TextStyle(fontSize: 13, color: Color(0xFF6B7280), fontFamily: 'Inter')),
                        ],
                      ),
                    ),
                    Container(
                      height: 40,
                      width: 40,
                      decoration: const BoxDecoration(color: Color(0xFFE8F5E9), shape: BoxShape.circle),
                      child: const Icon(Icons.phone, color: Colors.green),
                    )
                  ],
                ),
              ),
              const Spacer(),
            ],
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              color: const Color(0xFFF5F6F8),
              child: Container(
                height: 52,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(100),
                  gradient: const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)]),
                ),
                child: ElevatedButton(
                  onPressed: onTrackProgress,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent),
                  child: const Text("View Service Status Tracker", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500, fontFamily: 'Inter')),
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}