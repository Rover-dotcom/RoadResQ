import 'package:flutter/material.dart';

class SelectVehicleScreen extends StatefulWidget {
  final VoidCallback onBack;
  final ValueChanged<String> onContinue;

  const SelectVehicleScreen({Key? key, required Truman, required this.onBack, required this.onContinue}) : super(key: key);

  @override
  State<SelectVehicleScreen> createState() => _SelectVehicleScreenState();
}

class _SelectVehicleScreenState extends State<SelectVehicleScreen> {
  String _selectedId = 'car';

  final List<Map<String, String>> _types = [
    {'id': 'car', 'label': 'Car'},
    {'id': 'suv', 'label': 'SUV'},
    {'id': '4x4', 'label': '4X4'},
    {'id': 'van', 'label': 'Van'},
    {'id': 'motorcycle', 'label': 'Motorcycle'},
    {'id': 'others', 'label': 'Others'},
  ];

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Column(
          children: [
            // Standard Flow Header
            Container(
              height: 128,
              width: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFF013480), Color(0xFF0282DD)],
                ),
              ),
              padding: const EdgeInsets.only(bottom: 20, left: 20, right: 20),
              child: Align(
                alignment: Alignment.bottomCenter,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
                      onPressed: widget.onBack,
                      style: IconButton.styleFrom(backgroundColor: Colors.white10),
                    ),
                    const Text(
                      'Select Vehicle',
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w500, fontFamily: 'Inter'),
                    ),
                    const SizedBox(width: 48), // Balancing element
                  ],
                ),
              ),
            ),
            
            // Step Progress Track
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 6,
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(100)),
                      alignment: Alignment.centerLeft,
                      child: FractionallySizedBox(
                        widthFactor: 0.22,
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(100),
                            gradient: const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)]),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(100),
                      gradient: const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)]),
                    ),
                    child: const Text('Step 1/9', style: TextStyle(color: Colors.white, fontSize: 10)),
                  )
                ],
              ),
            ),

            // Core Layout View
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 10),
                    const Text('Select your vehicle', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black, fontFamily: 'Inter')),
                    const Text('What type of vehicle needs towing?', style: TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
                    
                    // Vehicle Center Stage Visual Block
                    SizedBox(
                      height: 200,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 140,
                            height: 140,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFFFF7A00).withOpacity(0.35),
                            ),
                          ),
                          // High Fidelity Mock Image Target Placement
                          const Icon(Icons.directions_car_filled, size: 100, color: Colors.white),
                        ],
                      ),
                    ),

                    // Selector Button Layout Grid
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 2.3,
                      ),
                      itemCount: _types.length,
                      itemBuilder: (context, index) {
                        final item = _types[index];
                        final isSelected = _selectedId == item['id'];
                        return GestureDetector(
                          onTap: () => setState(() => _selectedId = item['id']!),
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(100),
                              gradient: isSelected
                                  ? const LinearGradient(
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                      colors: [Color(0xFF013480), Color(0xFF0282DD)],
                                    )
                                  : null,
                              color: isSelected ? null : Colors.white,
                              border: isSelected ? null : Border.all(color: Colors.grey.shade100),
                              boxShadow: const [BoxShadow(color: Colors.black05, blurRadius: 4, offset: Offset(0, 2))],
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              item['label']!,
                              style: TextStyle(
                                color: isSelected ? Colors.white : const Color(0xFF333743),
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),

        // Fixed Action Drawer
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [Color(0xFFF5F6F8), Color(0xFFF5F6F8), Colors.transparent],
                stops: [0.0, 0.8, 1.0],
              ),
            ),
            child: ElevatedButton(
              onPressed: () => widget.onContinue(_selectedId),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                backgroundColor: const Color(0xFF013480),
                foregroundColor: Colors.white,
                elevation: 2,
              ),
              child: const Text('Continue', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
            ),
          ),
        )
      ],
    );
  }
}