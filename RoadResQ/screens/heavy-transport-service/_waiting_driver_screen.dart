import 'package:flutter/material.dart';

// FIX: Made the class public so your flow coordinator can read it, 
// and cleanly stripped the broken duplicate tracking class at the bottom.
class WaitingDriverScreen extends StatefulWidget {
  final VoidCallback onDriverAssigned;

  const WaitingDriverScreen({super.key, required this.onDriverAssigned});

  @override
  State<WaitingDriverScreen> createState() => _WaitingDriverScreenState();
}

class _WaitingDriverScreenState extends State<WaitingDriverScreen> {
  @override
  void initState() {
    super.initState();
    // Delays for 3 seconds to emulate background server matches, then steps forward
    Future.delayed(const Duration(seconds: 3), widget.onDriverAssigned);
  }

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 70,
            height: 70,
            child: CircularProgressIndicator(
              strokeWidth: 5, 
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF013480)),
            ),
          ),
          SizedBox(height: 36),
          Text(
            'Securing Platform Carrier Fleet', 
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black),
          ),
          SizedBox(height: 6),
          Text(
            'Matching equipment profiles with qualified regional operators...', 
            style: TextStyle(color: Colors.grey, fontSize: 13), 
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}