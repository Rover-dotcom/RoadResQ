import 'package:flutter/material.dart';

class RepairTypeScreen extends StatefulWidget {
  final Function(String) onContinue;
  final VoidCallback onBack;

  const RepairTypeScreen({Key? key, required this.onContinue, required this.onBack}) : super(key: key);

  @override
  State<RepairTypeScreen> createState() => _RepairTypeScreenState();
}

class _RepairTypeScreenState extends State<RepairTypeScreen> {
  String? _selectedType; // 'workshop' or 'onsite'

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      body: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Container(
                height: 128,
                width: double.infinity,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF013480), Color(0xFF0282DD)],
                  ),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      left: 20,
                      top: 68,
                      child: GestureDetector(
                        onTap: widget.onBack,
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
                        "Repair Type",
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w500, fontFamily: 'Inter'),
                      ),
                    ),
                  ],
                ),
              ),

              // Progress Tracker - Step 1/9
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
                            width: constraints.maxWidth * (1 / 9),
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
                        child: const Text("Step 1/9", style: TextStyle(color: Colors.white, fontSize: 10, fontFamily: 'Inter')),
                      ),
                    ),
                  ],
                ),
              ),

              // Content
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      "How do you want us to handle it?",
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black, fontFamily: 'Inter'),
                    ),
                    SizedBox(height: 4),
                    Text(
                      "Select your preferred dispatch method",
                      style: TextStyle(fontSize: 14, color: Color(0xFF6B7280), fontFamily: 'Inter'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Selections List
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  children: [
                    _buildOptionBox(
                      id: "workshop",
                      title: "Send to mechanical workshop",
                      subtitle: "Recovery truck picks up your vehicle",
                      icon: Icons.local_shipping_outlined,
                    ),
                    const SizedBox(height: 16),
                    _buildOptionBox(
                      id: "onsite",
                      title: "Onsite Mechanic",
                      subtitle: "A mobile service mechanic comes straight to you",
                      icon: Icons.build_circle_outlined,
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Continue Button Panel
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              color: const Color(0xFFF5F6F8),
              child: Opacity(
                opacity: _selectedType == null ? 0.4 : 1.0,
                child: Container(
                  height: 52,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(100),
                    gradient: const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)]),
                  ),
                  child: ElevatedButton(
                    onPressed: _selectedType == null ? null : () => widget.onContinue(_selectedType!),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent),
                    child: const Text("Continue", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500, fontFamily: 'Inter')),
                  ),
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildOptionBox({required String id, required String title, required String subtitle, required IconData icon}) {
    final isSelected = _selectedType == id;
    return GestureDetector(
      onTap: () => setState(() => _selectedType = id),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? const Color(0xFF013480) : const Color(0xFFE5E7EB), width: 2),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3))],
        ),
        child: Row(
          children: [
            Icon(icon, size: 32, color: isSelected ? const Color(0xFF0282DD) : const Color(0xFF6B7280)),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black, fontFamily: 'Inter')),
                  const SizedBox(height: 4),
                  Text(subtitle, style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280), fontFamily: 'Inter')),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: Color(0xFF013480), size: 24)
          ],
        ),
      ),
    );
  }
}// TODO Implement this library.