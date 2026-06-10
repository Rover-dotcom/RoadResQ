import 'package:flutter/material.dart';

class SummaryScreen extends StatelessWidget {
  final VoidCallback onConfirm;
  final VoidCallback onBack;

  const SummaryScreen({Key? key, required this.onConfirm, required this.onBack}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      body: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 128,
                width: double.infinity,
                decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)])),
                child: Stack(
                  children: [
                    Positioned(
                      left: 20,
                      top: 68,
                      child: GestureDetector(
                        onTap: onBack,
                        child: Container(
                          height: 40,
                          width: 40,
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.12), shape: BoxShape.circle),
                          child: const Icon(Icons.chevron_left, color: Colors.white),
                        ),
                      ),
                    ),
                    const Positioned(
                      left: 0,
                      right: 0,
                      top: 78,
                      child: Text(
                        "Job Overview",
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w500, fontFamily: 'Inter'),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 17.0),
                child: Column(
                  children: [
                    Container(
                      height: 6,
                      width: double.infinity,
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(100)),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: LayoutBuilder(
                          builder: (context, constraints) => Container(
                            height: 6,
                            width: constraints.maxWidth * (7 / 9),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)]),
                              borderRadius: BorderRadius.circular(100),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)]),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: const Text("Step 7/9", style: TextStyle(color: Colors.white, fontSize: 10, fontFamily: 'Inter')),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.only(left: 20, right: 20, bottom: 100),
                  children: [
                    const Text("Verify Request Details", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black, fontFamily: 'Inter')),
                    const SizedBox(height: 20),
                    _buildSummaryCard("Vehicle", "Toyota Land Cruiser (2022)\nPlate: 554321 • White"),
                    _buildSummaryCard("Issues Picked", "Engine problem, Transmission fault"),
                    _buildSummaryCard("Dispatch Method", "Send to mechanical workshop (Recovery)"),
                    _buildSummaryCard("Assigned Destination", "Al Watan Certified Workshop\nStreet 24, Industrial Area"),
                    _buildSummaryCard("Reported Timeline", "Today morning around 08:30 AM"),
                  ],
                ),
              )
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
                  onPressed: onConfirm,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent),
                  child: const Text("Confirm & Post Request", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500, fontFamily: 'Inter')),
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String title, String content) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0282DD), fontFamily: 'Inter')),
          const SizedBox(height: 6),
          Text(content, style: const TextStyle(fontSize: 14, color: Colors.black87, height: 1.4, fontFamily: 'Inter')),
        ],
      ),
    );
  }
}