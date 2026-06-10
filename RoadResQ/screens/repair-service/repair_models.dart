// lib/screens/repair-service/repair_models.dart

class VehicleRepairDetails {
  final String manufacturer;
  final String model;
  final String color;
  final String plate;

  VehicleRepairDetails({
    required this.manufacturer,
    required this.model,
    required this.color,
    required this.plate,
  });
}

class GarageItem {
  final String id;
  final String name;
  final String address;
  final String distance;
  final double rating;

  GarageItem({
    required this.id,
    required this.name,
    required this.address,
    required this.distance,
    required this.rating,
  });
}