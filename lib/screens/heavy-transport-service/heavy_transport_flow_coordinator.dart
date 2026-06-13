import 'package:flutter/material.dart';
import 'epod_closeout_screen.dart';
import 'equipment_profile_screen.dart';
import 'safety_checks_screen.dart';
import '_schedule_time_screen.dart';
import '_calendar_matrix_screen.dart';
import '_geofenced_routing_screen.dart';
import '_gate_pass_upload_screen.dart';
import '_bidding_engine_screen.dart';
import '_payment_settlement_screen.dart';
import '_waiting_driver_screen.dart';
import '_transit_manifest_screen.dart';

class HeavyTransportFlowCoordinator extends StatefulWidget {
  final VoidCallback onExitFlow; // FIX: Added named exit parameter

  // FIX: Added proper key pass-through alongside the required exit callback
  const HeavyTransportFlowCoordinator({
    super.key, 
    required this.onExitFlow,
  });

  @override
  State<HeavyTransportFlowCoordinator> createState() => _HeavyTransportFlowCoordinatorState();
}

class _HeavyTransportFlowCoordinatorState extends State<HeavyTransportFlowCoordinator> {
  final PageController _pageController = PageController();
  int _currentStep = 0;

  // Global Flow State Management Variables
  String _schedulingAllocationType = 'now'; 

  void _navigateToStep(int targetIndex) {
    setState(() {
      _currentStep = targetIndex;
    });
    _pageController.animateToPage(
      targetIndex,
      duration: const Duration(milliseconds: 450),
     curve: Curves.easeInOutCubic, 
    );
  }

  void _handleBackNavigation() {
    if (_currentStep == 0) {
      // FIX: Triggers routing transition back to home if user hits back on step 1
      widget.onExitFlow(); 
    } else if (_currentStep == 4 && _schedulingAllocationType == 'now') {
      // Direct conditional branch logic bypass if skipping Step 4 (Calendar)
      _navigateToStep(2); 
    } else {
      _navigateToStep(_currentStep - 1);
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(100),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF013480), Color(0xFF0282dd)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    // Changed condition to allow back navigation on step 0 to exit flow
                    if (_currentStep < 10)
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
                        onPressed: _handleBackNavigation,
                      )
                    else
                      const SizedBox(width: 48),
                    Expanded(
                      child: Text(
                        'Heavy Logistics Matrix (${_currentStep + 1}/11)',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 48),
                  ],
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: (_currentStep + 1) / 11,
                      backgroundColor: Colors.white.withOpacity(0.2),
                      valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                      minHeight: 6,
                    ),
                  ),
                )
              ],
            ),
          ),
        ),
      ),
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(), // Blocks manual swipes without data metric checks
        children: [
          EquipmentProfileScreen(
            onContinue: (equipmentClass) {
              _navigateToStep(1);
            },
          ),
          SafetyChecksScreen(
            onContinue: () => _navigateToStep(2),
            onBack: _handleBackNavigation,
          ),
          ScheduleTimeScreen(
            onContinue: (allocationType) {
              _schedulingAllocationType = allocationType;
              if (allocationType == 'schedule') {
                _navigateToStep(3); // Go to Step 4 (Calendar Matrix)
              } else {
                _navigateToStep(4); // Skip step 4, jump directly to Step 5 (Geofenced Routing)
              }
            },
            onBack: _handleBackNavigation,
          ),
          CalendarMatrixScreen(
            onContinue: () => _navigateToStep(4),
            onBack: _handleBackNavigation,
          ),
          GeofencedRoutingScreen(
            onContinue: () => _navigateToStep(5),
            onBack: _handleBackNavigation,
          ),
          GatePassUploadScreen(
            onContinue: () => _navigateToStep(6),
            onBack: _handleBackNavigation,
          ),
          BiddingEngineScreen(
            onContinue: () => _navigateToStep(7),
            onBack: _handleBackNavigation,
          ),
          PaymentSettlementScreen(
            onContinue: () => _navigateToStep(8),
            onBack: _handleBackNavigation,
          ),
          WaitingDriverScreen(
            onDriverAssigned: () => _navigateToStep(9),
          ),
          TransitManifestScreen(
            onContinue: () => _navigateToStep(10),
          ),
          EpodCloseoutScreen(
            onReset: () {
              setState(() {
                _schedulingAllocationType = 'now';
              });
              widget.onExitFlow(); // Exit back out seamlessly on reset
            },
          ),
        ],
      ),
    );
  }
}