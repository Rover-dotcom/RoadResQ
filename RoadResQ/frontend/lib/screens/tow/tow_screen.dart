import 'package:flutter/material.dart';

class TowScreen extends StatefulWidget {
  const TowScreen({super.key});

  @override
  State<TowScreen> createState() => _TowScreenState();
}

class _TowScreenState extends State<TowScreen> {
  String selected = "";

  final List vehicles = [
    "Sedan",
    "SUV",
    "4x4",
    "Motorcycle",
    "ATV",
    "Others"
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Tow Service")),
      body: Column(
        children: [
          Wrap(
            children: vehicles.map((v) {
              return ChoiceChip(
                label: Text(v),
                selected: selected == v,
                onSelected: (_) => setState(() => selected = v),
              );
            }).toList(),
          ),

          if (selected == "Others")
            Padding(
              padding: const EdgeInsets.all(10),
              child: TextField(
                decoration: const InputDecoration(
                  hintText: "What is it?",
                  border: OutlineInputBorder(),
                ),
              ),
            )
        ],
      ),
    );
  }
}
