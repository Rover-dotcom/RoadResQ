import 'package:flutter/material.dart';
import 'tow_service_models.dart';
import 'screens/select_vehicle_screen.dart';
import 'screens/vehicle_details_screen.dart';
import 'screens/schedule_time_screen.dart';

class TowServiceWizard extends StatefulWidget {
  const TowServiceWizard({Key? key}) : super(key: key);

  @override
  State<TowServiceWizard> createState() => _TowServiceWizardState();
}

class _TowServiceWizardState extends State<TowServiceWizard> {
  final PageController _pageController = PageController();
  
  // Accumulated Wizard State
  String _selectedVehicleType = 'car';
  final VehicleDetailsData _detailsData = VehicleDetailsData();
  ScheduleType? _scheduleType;
  String? _scheduledDateTime;

  void _nextPage() {
    _pageController.nextPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _previousPage() {
    _pageController.previousPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(), // Lock swipe gestures to enforce button logic
        children: [
          SelectVehicleScreen(
            onBack: () => Navigator.maybePop(context),
            onContinue: (type) {
              setState(() => _selectedVehicleType = type);
              _nextPage();
            },
          ),
          VehicleDetailsScreen(
            onBack: _previousPage,
            onContinue: (details) {
              setState(() {
                _detailsData.manufacturer = details.manufacturer;
                _detailsData.model = details.model;
                _detailsData.color = details.color;
                _detailsData.plate = details.plate;
                _detailsData.problem = details.problem;
                _detailsData.photo = details.photo;
              });
              _nextPage();
            },
          ),
          ScheduleTimeScreen(
            onBack: _previousPage,
            onContinue: (type, dateTime) {
              setState(() {
                _scheduleType = type;
                _scheduledDateTime = dateTime;
              });
              // Final Step Payload Execution
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Processing Tow Request...')),
              );
            },
          ),
        ],
      ),
    );
  }
}