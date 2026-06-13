import 'dart:io';

enum ScheduleType { now, later }

class VehicleDetailsData {
  String manufacturer;
  String model;
  String color;
  String plate;
  String problem;
  File? photo;

  VehicleDetailsData({
    this.manufacturer = '',
    this.model = '',
    this.color = '',
    this.plate = '',
    this.problem = '',
    this.photo,
  });
}