import 'package:flutter/material.dart';
import '../tow/tow_screen.dart';
import '../garage/garage_screen.dart';
import '../heavy/heavy_screen.dart';
import '../quote/quote_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  Widget serviceCard(BuildContext context, String title, Widget screen) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => screen),
      ),
      child: Container(
        padding: const EdgeInsets.all(20),
        margin: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.orange.shade100,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(title, style: const TextStyle(fontSize: 18)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("RoadResQ")),
      body: Column(
        children: [
          serviceCard(context, "Tow", const TowScreen()),
          serviceCard(context, "Garage", const GarageScreen()),
          serviceCard(context, "Heavy", const HeavyScreen()),
          serviceCard(context, "Quote", const QuoteScreen()),
        ],
      ),
    );
  }
}
