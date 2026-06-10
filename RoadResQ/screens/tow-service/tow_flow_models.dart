import 'dart:io';

enum ScheduleType { now, later }
enum AccessType { standard, industrial }

/// Data carrier class explicitly required by vehicle_details_screen.dart
class VehicleDetailsData {
  final String manufacturer;
  final String model;
  final String color;
  final String plateNumber;
  final String problemDescription;

  VehicleDetailsData({
    required this.manufacturer,
    required this.model,
    required this.color,
    required this.plateNumber,
    required this.problemDescription,
  });
}

class TowFlowState {
  // Step 1: Safety & Access
  AccessType accessType;
  String gatePassNumber;
  bool safetyGearVerified;

  // Step 2: Vehicle Classification
  String selectedVehicleType; // 'car', 'suv', '4x4', 'van', 'motorcycle', 'others'

  // Step 3: Attribute Specifications
  String manufacturer;
  String model;
  String color;
  String plateNumber;
  String issueDescription;
  File? loadPhoto;

  // Step 4: Dispatch Targets
  ScheduleType scheduleType;
  String? scheduledDateTime;

  TowFlowState({
    this.accessType = AccessType.standard,
    this.gatePassNumber = '',
    this.safetyGearVerified = false,
    this.selectedVehicleType = 'car',
    this.manufacturer = '',
    this.model = '',
    this.color = '',
    this.plateNumber = '',
    this.issueDescription = '',
    this.loadPhoto,
    this.scheduleType = ScheduleType.now,
    this.scheduledDateTime,
  });
}