import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:road_resq/provider/job_provider.dart';
import 'tow_flow_models.dart';

// Clean relative pathing imports to bypass local file-system URI panics
import 'safety_access_screen.dart';
import 'vehicle_select_screen.dart';
import 'vehicle_details_screen.dart';
import 'schedule_time_screen.dart';
import 'location_picker_screen.dart';
import 'bidding_marketplace_screen.dart';
import 'transit_tracking_screen.dart';

class TowFlowWizard extends StatefulWidget {
  final VoidCallback? onExitFlow;
  const TowFlowWizard({Key? key, this.onExitFlow}) : super(key: key);

  @override
  State<TowFlowWizard> createState() => _TowFlowWizardState();
}

class _TowFlowWizardState extends State<TowFlowWizard> {
  final PageController _pageController = PageController();
  final TowFlowState _flowState = TowFlowState();
  int _currentStepIndex = 0;

  void _navigateToIndex(int index) {
    setState(() => _currentStepIndex = index);
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
    );
  }

  void _handleBack() {
    if (_currentStepIndex == 0) {
      if (widget.onExitFlow != null) {
        widget.onExitFlow!();
      } else {
        Navigator.maybePop(context);
      }
      return;
    }

    if (_currentStepIndex == 2 && _flowState.selectedVehicleType == 'others') {
      _navigateToIndex(1);
      return;
    }
    
    _navigateToIndex(_currentStepIndex - 1);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          // Step 1: Restricted Access Controls
          SafetyAccessScreen(
            onBack: _handleBack,
            onContinue: (accessType, passNo, gearChecked) {
              _flowState.accessType = accessType;
              _flowState.gatePassNumber = passNo;
              _flowState.safetyGearVerified = gearChecked;
              _navigateToIndex(1);
            },
          ),

          // Step 2: Vehicle Classification
          VehicleSelectScreen(
            onBack: _handleBack,
            onContinue: (selectedType) {
              _flowState.selectedVehicleType = selectedType;
              _navigateToIndex(2);
            },
          ),

          // Step 3: Attribute Specifications
          VehicleDetailsScreen(
            onBack: _handleBack,
            onContinue: (VehicleDetailsData details) {
              _flowState.manufacturer = details.manufacturer;
              _flowState.model = details.model;
              _flowState.color = details.color;
              _flowState.plateNumber = details.plateNumber;
              _flowState.issueDescription = details.problemDescription;
              _navigateToIndex(3);
            },
          ),

          // Step 4: Dispatch Targets
          ScheduleTimeScreen(
            onBack: _handleBack,
            onContinue: (scheduleType, dateTime) {
              _flowState.scheduleType = scheduleType;
              _flowState.scheduledDateTime = dateTime;
              _navigateToIndex(4);
            },
          ),

          // Step 5: GIS Location Layer Integration
          LocationPickerScreen(
            onBack: _handleBack,
            onContinue: (pickupLatLng, dropLatLng, distance) {
              _navigateToIndex(5);
            },
          ),

          // Step 6: Bidding Board & Reverse Auction Matrix
          BiddingMarketplaceScreen(
            onBack: _handleBack,
            onConfirmedBid: (driverId, finalizedPrice) async {
              // Create real job in Firestore
              final userId = FirebaseAuth.instance.currentUser?.uid ?? '';
              final jobProvider = Provider.of<JobProvider>(context, listen: false);
              await jobProvider.createJob(
                userId: userId,
                serviceType: 'tow',
                vehicleType: _flowState.selectedVehicleType ?? 'Vehicle',
                pickup: 'Pickup Location',
                drop: 'Drop Location',
                description: _flowState.issueDescription ?? 'Tow service request',
              );
              _navigateToIndex(6);
            },
          ),

          // Step 7: Active Transit Telematics Engine
          TransitTrackingScreen(
            onJobCompleted: () {
              if (widget.onExitFlow != null) {
                widget.onExitFlow!();
              } else {
                setState(() => _currentStepIndex = 0);
                Navigator.of(context).pop();
              }
            },
          ),
        ],
      ),
    );
  }
}