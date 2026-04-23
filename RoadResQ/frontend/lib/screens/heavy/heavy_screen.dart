import 'package:flutter/material.dart';

class HeavyScreen extends StatelessWidget {
  const HeavyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Heavy Equipment")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          TextField(decoration: InputDecoration(labelText: "Weight")),
          TextField(decoration: InputDecoration(labelText: "Dimensions")),
          TextField(decoration: InputDecoration(labelText: "Notes")),
        ],
      ),
    );
  }
}
