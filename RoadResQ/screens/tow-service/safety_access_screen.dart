import 'package:flutter/material.dart';
import 'package:road_resq/screens/tow-service/tow_flow_models.dart';
import 'package:road_resq/features/tow_booking/widgets/tow_flow_helpers.dart';

class SafetyAccessScreen extends StatefulWidget {
  final VoidCallback onBack;
  final Function(AccessType, String, bool) onContinue;

  const SafetyAccessScreen({Key? key, required this.onBack, required this.onContinue}) : super(key: key);

  @override
  State<SafetyAccessScreen> createState() => _SafetyAccessScreenState();
}

class _SafetyAccessScreenState extends State<SafetyAccessScreen> {
  AccessType _accessType = AccessType.standard;
  final _passController = TextEditingController();
  bool _safetyGear = false;

  bool get _isFormValid => _accessType == AccessType.standard || (_passController.text.trim().isNotEmpty && _safetyGear);

  @override
  Widget build(BuildContext context) {
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
                const Text('Zone Clearance Verification', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                const Text('Specify your pickup zone environment parameters.', style: TextStyle(color: Color(0xFF6B7280))),
                const SizedBox(height: 24),
                
                // Zone Selection Toggles
                Row(
                  children: [
                    Expanded(
                      child: _buildSelectorCard(
                        title: 'Standard Zone',
                        subtitle: 'Public highways & city routes',
                        icon: Icons.add_road,
                        isSelected: _accessType == AccessType.standard,
                        onTap: () => setState(() => _accessType = AccessType.standard),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildSelectorCard(
                        title: 'Restricted Industrial',
                        subtitle: 'Ports, refineries & plants',
                        icon: Icons.factory,
                        isSelected: _accessType == AccessType.industrial,
                        onTap: () => setState(() => _accessType = AccessType.industrial),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Animated Industrial Clearance Drawer
                AnimatedSize(
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeInOut,
                  child: _accessType == AccessType.industrial
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Entry Pass Number / Work Permit ID', style: TextStyle(color: Color(0xFF6B7280), fontSize: 13)),
                            const SizedBox(height: 6),
                            Container(
                              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                              child: TextField(
                                controller: _passController,
                                decoration: const InputDecoration(
                                  hintText: 'Enter gate access code',
                                  contentPadding: EdgeInsets.all(16),
                                  border: InputBorder.none,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            CheckboxListTile(
                              title: const Text('I confirm the operator has PPE (Steel shoes, high-vis vest, helmet)', style: TextStyle(fontSize: 13)),
                              value: _safetyGear,
                              onChanged: (val) => setState(() => _safetyGear = val ?? false),
                              controlAffinity: ListTileControlAffinity.leading,
                              contentPadding: EdgeInsets.zero,
                              activeColor: const Color(0xFF013480),
                            ),
                          ],
                        )
                      : const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ),
        buildBottomActionBar(
          label: 'Verify & Continue',
          onPressed: _isFormValid ? () => widget.onContinue(_accessType, _passController.text, _safetyGear) : null,
        )
      ],
    );
  }

  Widget _buildSelectorCard({required String title, required String subtitle, required IconData icon, required bool isSelected, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        height: 140,
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF013480) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? Colors.transparent : Colors.grey.shade200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: isSelected ? Colors.white : Colors.grey, size: 28),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: isSelected ? Colors.white : Colors.black, fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                Text(subtitle, style: TextStyle(color: isSelected ? Colors.white70 : Colors.grey, fontSize: 11)),
              ],
            )
          ],
        ),
      ),
    );
  }
}