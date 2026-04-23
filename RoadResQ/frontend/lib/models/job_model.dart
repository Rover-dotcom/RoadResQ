class Job {
  final String id;
  final String serviceType;
  final String? vehicleType;
  final String? customItem;

  Job({
    required this.id,
    required this.serviceType,
    this.vehicleType,
    this.customItem,
  });

  factory Job.fromJson(Map<String, dynamic> json) {
    return Job(
      id: json['_id'],
      serviceType: json['serviceType'],
      vehicleType: json['vehicleType'],
      customItem: json['customItem'],
    );
  }
}
