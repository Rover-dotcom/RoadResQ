import 'package:flutter/material.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('RoadResQ Main Shell', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0.5,
        centerTitle: true,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.dashboard_customize_outlined, size: 70, color: Color(0xFF0056B3)),
            const SizedBox(height: 16),
            const Text(
              'Dashboard Main Shell Frame',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black),
            ),
            const SizedBox(height: 8),
            Text(
              'Ready for your 40+ upcoming structural screen additions.',
              style: TextStyle(color: Colors.black.withOpacity(0.4), fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}