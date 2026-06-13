import 'package:flutter/material.dart';

class VehicleType {
  final String label;
  final IconData icon;
  VehicleType({required this.label, required this.icon});
}

class ServiceCardData {
  final String title;
  final String iconPath; // Use IconData or local asset path
  ServiceCardData({required this.title, this.iconPath = ''});
}

class BookingState {
  bool inBasement;
  String selectedVehicleType;
  String vehicleMake;
  String vehicleModelYear;
  String vehicleColor;
  String vehiclePlate;
  bool isNow;
  DateTime? scheduledDate;
  String? scheduledTime;
  String pickupAddress;
  
  BookingState({
    this.inBasement = false,
    this.selectedVehicleType = 'Car',
    this.vehicleMake = '',
    this.vehicleModelYear = '',
    this.vehicleColor = '',
    this.vehiclePlate = '',
    this.isNow = true,
    this.pickupAddress = '2212B Baker Street . Detected',
  });
}