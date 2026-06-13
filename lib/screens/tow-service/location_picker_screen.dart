import 'package:flutter/material.dart';
import 'package:road_resq/features/tow_booking/widgets/tow_flow_helpers.dart';

class LocationPickerScreen extends StatelessWidget {
  final VoidCallback onBack;
  final Function(dynamic, dynamic, double) onContinue;

  const LocationPickerScreen({Key? key, required this.onBack, required this.onContinue}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        buildWizardHeader(title: 'Route Setup', onBack: onBack),
buildProgressIndicator(value: 0.14, label: 'Step 1/7'),
        Expanded(
          child: Stack(
            children: [
              // Mock Map Workspace Area Component
              Container(
                color: Colors.grey.shade300,
                child: const Center(
                  child: Icon(Icons.map, size: 64, color: Colors.grey),
                ),
              ),
              
              // Top Overlay Route Cards
              Positioned(
                top: 16,
                left: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.circle, color: Colors.green, size: 14),
                          SizedBox(width: 12),
                          Expanded(child: Text('Pickup: Mesaieed Industrial City Gate 3', style: TextStyle(fontSize: 13, overflow: TextOverflow.ellipsis))),
                        ],
                      ),
                      const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Divider()),
                      Row(
                        children: const [
                          Icon(Icons.location_on, color: Colors.red, size: 14),
                          SizedBox(width: 12),
                          Expanded(child: Text('Dropoff: Industrial Area Street 24 workshop', style: TextStyle(fontSize: 13, overflow: TextOverflow.ellipsis))),
                        ],
                      ),
                    ],
                  ),
                ),
              )
            ],
          ),
        ),
        buildBottomActionBar(
          label: 'Calculate Fare Metrics',
          onPressed: () => onContinue(null, null, 42.5),
        )
      ],
    );
  }
}