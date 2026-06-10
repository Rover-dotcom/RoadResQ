import 'package:flutter/material.dart';
import 'package:road_resq/features/tow_booking/widgets/tow_flow_helpers.dart';

class VehicleSelectScreen extends StatefulWidget {
  final VoidCallback onBack;
  final ValueChanged<String> onContinue;

  const VehicleSelectScreen({Key? key, required this.onBack, required this.onContinue}) : super(key: key);

  @override
  State<VehicleSelectScreen> createState() => _VehicleSelectScreenState();
}

class _VehicleSelectScreenState extends State<VehicleSelectScreen> {
  String _selectedId = 'car';

  final List<Map<String, String>> _types = [
    {'id': 'car', 'label': 'Car', 'asset': 'assets/images/car_tow.png'},
    {'id': 'suv', 'label': 'SUV', 'asset': 'assets/images/suv_tow.png'},
    {'id': '4x4', 'label': '4X4', 'asset': 'assets/images/4x4_tow.png'},
    {'id': 'van', 'label': 'Van', 'asset': 'assets/images/van_tow.png'},
    {'id': 'motorcycle', 'label': 'Motorcycle', 'asset': 'assets/images/bike_tow.png'},
    {'id': 'others', 'label': 'Others', 'asset': 'assets/images/generic_tow.png'},
  ];

  @override
  Widget build(BuildContext context) {
    // Dynamic asset selection logic based on the highlighted button item
    final activeVehicle = _types.firstWhere((element) => element['id'] == _selectedId);

    return Column(
      children: [
        buildWizardHeader(title: 'Safety & Site Access', onBack: widget.onBack),
buildProgressIndicator(value: 0.14, label: 'Step 1/7'),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 10),
                const Text('What needs towing?', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                const Text('Select classification to matching dispatch carrier.', style: TextStyle(color: Color(0xFF6B7280))),
                
                // Dynamic Asset Box Container
                SizedBox(
                  height: 180,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 130,
                        height: 130,
                        decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFF0282DD).withOpacity(0.1)),
                      ),
                      // Image paths swap automatically based on state selection values
                      Image.asset(
                        activeVehicle['asset']!,
                        width: 160,
                        height: 120,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          // Fallback system handling missing local assets elegantly
                          return Icon(
                            _selectedId == 'motorcycle' ? Icons.motorcycle : Icons.directions_car_filled,
                            size: 80,
                            color: const Color(0xFF0282DD),
                          );
                        },
                      ),
                    ],
                  ),
                ),

                // Grid Layout System
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 2.2,
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
                          gradient: isSelected ? const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)]) : null,
                          color: isSelected ? null : Colors.white,
                          border: isSelected ? null : Border.all(color: Colors.grey.shade200),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          item['label']!,
                          style: TextStyle(color: isSelected ? Colors.white : Colors.black12, fontWeight: FontWeight.w500),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
        buildBottomActionBar(
          label: 'Confirm Category',
          onPressed: () => widget.onContinue(_selectedId),
        )
      ],
    );
  }
}