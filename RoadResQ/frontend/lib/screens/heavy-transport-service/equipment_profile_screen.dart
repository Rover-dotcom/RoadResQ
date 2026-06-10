import 'package:flutter/material.dart';

class EquipmentProfileScreen extends StatefulWidget {
  final Function(String) onContinue;

  const EquipmentProfileScreen({super.key, required this.onContinue});

  @override
  State<EquipmentProfileScreen> createState() => _EquipmentProfileScreenState();
}

class _EquipmentProfileScreenState extends State<EquipmentProfileScreen> {
  String selectedCategory = '';
  final List<String> categories = [
    "Excavator", "Bulldozer", "Crawler Crane", "Rig Generator", "Articulated Dump Truck"
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Equipment Profile',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black, letterSpacing: -0.5),
          ),
          const SizedBox(height: 4),
          const Text('Select your heavy asset fleet profile configuration.', style: TextStyle(fontSize: 14, color: Colors.grey)),
          const SizedBox(height: 24),
          Expanded(
            child: ListView.builder(
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final cat = categories[index];
                final isSelected = selectedCategory == cat;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? const Color(0xFF013480) : Colors.grey.shade200,
                      width: 2,
                    ),
                  ),
                  child: ListTile(
                    title: Text(cat, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
                    onTap: () => setState(() => selectedCategory = cat),
                  ),
                );
              },
            ),
          ),
          ElevatedButton(
            onPressed: selectedCategory.isEmpty ? null : () => widget.onContinue(selectedCategory),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF013480),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
            ),
            child: const Text('Continue to Safety Checks', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}