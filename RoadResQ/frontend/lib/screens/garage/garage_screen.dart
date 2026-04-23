import 'package:flutter/material.dart';

class GarageScreen extends StatelessWidget {
  const GarageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Garage")),
      body: Column(
        children: [
          ElevatedButton(
            onPressed: () {},
            child: const Text("Urgent"),
          ),
          ElevatedButton(
            onPressed: () {},
            child: const Text("Request Quote"),
          ),
        ],
      ),
    );
  }
}
