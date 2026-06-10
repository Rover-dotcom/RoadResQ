import 'dart:io';

class InquiryStateModel {
  // Step 1 & 2: Coordinates
  String pickupLocation = "Mesaieed Industrial Area, Sector 3";
  String dropoffLocation = "Ras Laffan, Gate 5";

  // Step 3: Core Details
  String itemType = "";
  String requirementDescription = "";
  String loadCapacity = "";

  // Step 4: Technical Specifications
  String itemSpecification = "";
  String dimensions = "";
  String quantity = "";
  String unit = "Tons";
  bool isFragile = false;
  String accessRestrictions = "";
  File? attachmentPhoto;

  // Step 5: Contact Matrix
  String corporateName = "";
  String contactPhone = "";
  String contactEmail = "";
  String preferredCallTime = "Morning (08:00 - 12:00)";

  // Step 6: Dispatch Timeline
  String urgencyProtocol = "now"; // 'now' or 'schedule'
  DateTime? scheduledDateTime;

  // Step 7: Fleet Logistics Configuration
  String selectedVehicleClass = "";
  bool autoVehicleRecommendation = true;

  // Mocked Engine Pricing Profile
  double calculatedBaseTariff = 3850.00;
}