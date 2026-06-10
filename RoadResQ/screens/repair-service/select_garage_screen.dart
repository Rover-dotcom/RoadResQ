import 'package:flutter/material.dart';
import 'repair_models.dart';

class SelectGarageScreen extends StatefulWidget {
  final Function(GarageItem) onContinue;
  final VoidCallback onBack;

  const SelectGarageScreen({Key? key, required this.onContinue, required this.onBack}) : super(key: key);

  @override
  State<SelectGarageScreen> createState() => _SelectGarageScreenState();
}

class _SelectGarageScreenState extends State<SelectGarageScreen> {
  GarageItem? _selectedGarage;

  final List<GarageItem> _garages = [
    GarageItem(id: "1", name: "Al Watan Certified Workshop", address: "Street 24, Industrial Area, Doha", distance: "2.4 km", rating: 4.8),
    GarageItem(id: "2", name: "Doha Elite Automotive Care", address: "Salwa Road, Block 5", distance: "5.1 km", rating: 4.6),
    GarageItem(id: "3", name: "Mesaieed Structural Maintenance", address: "Logistics Hub Zone, Mesaieed", distance: "14.2 km", rating: 4.9),
  ];

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
                        "Select Garage",
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
                            width: constraints.maxWidth * (5 / 9),
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
                        child: const Text("Step 5/9", style: TextStyle(color: Colors.white, fontSize: 10, fontFamily: 'Inter')),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      "Choose a partner workshop",
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black, fontFamily: 'Inter'),
                    ),
                    SizedBox(height: 4),
                    Text(
                      "Select a verified garage to assign vehicle repair builds.",
                      style: TextStyle(fontSize: 14, color: Color(0xFF6B7280), fontFamily: 'Inter'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.only(left: 20, right: 20, bottom: 100),
                  itemCount: _garages.length,
                  itemBuilder: (context, index) {
                    final garage = _garages[index];
                    final isSelected = _selectedGarage?.id == garage.id;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedGarage = garage),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: isSelected ? const Color(0xFF013480) : const Color(0xFFE5E7EB), width: 2),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3))],
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(garage.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black, fontFamily: 'Inter')),
                                  const SizedBox(height: 4),
                                  Text(garage.address, style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280), fontFamily: 'Inter')),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      const Icon(Icons.star, color: Colors.amber, size: 16),
                                      const SizedBox(width: 4),
                                      Text("${garage.rating}", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black, fontFamily: 'Inter')),
                                      const SizedBox(width: 12),
                                      const Icon(Icons.location_on_outlined, color: Color(0xFF0282DD), size: 16),
                                      const SizedBox(width: 4),
                                      Text(garage.distance, style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280), fontFamily: 'Inter')),
                                    ],
                                  )
                                ],
                              ),
                            ),
                            if (isSelected) const Icon(Icons.check_circle, color: Color(0xFF013480), size: 24),
                          ],
                        ),
                      ),
                    );
                  },
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
              child: Opacity(
                opacity: _selectedGarage == null ? 0.4 : 1.0,
                child: Container(
                  height: 52,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(100),
                    gradient: const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)]),
                  ),
                  child: ElevatedButton(
                    onPressed: _selectedGarage == null ? null : () => widget.onContinue(_selectedGarage!),
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
}