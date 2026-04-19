/// Category Engine — Week 3 Backend Core
///
/// Maps a vehicle/item type to a job category and pricing multiplier.
/// Week 3 pricing spec: base=250, perKm=5, heavyMultiplier=1.5

class CategoryEngine {
  // ─── Pricing Constants (Week 3 spec) ─────────────────────────────────────────
  static const double base = 250.0;
  static const double perKm = 5.0;
  static const double heavyMultiplier = 1.5;
  static const double leisureMultiplier = 1.0;

  // ─── Vehicle type → category mapping ─────────────────────────────────────────

  static const Map<String, String> _vehicleCategoryMap = {
    // Tow — Leisure category
    'sedan': 'leisure',
    'suv': 'leisure',
    '4x4': 'leisure',
    'motorcycle': 'leisure',
    'atv': 'leisure',

    // Heavy Transport category
    'precast block': 'heavy',
    'precast': 'heavy',
    'pallets': 'heavy',
    'pallets/bricks': 'heavy',
    'bricks': 'heavy',
    'container': 'heavy',
    'generator': 'heavy',
  };

  // ─── getCategory(vehicleType) ─────────────────────────────────────────────────
  /// Week 3 Task 1: Category Engine mapping logic.
  /// Returns 'leisure' or 'heavy'. Defaults to 'leisure'.
  static String getCategory(String vehicleType) {
    final key = vehicleType.trim().toLowerCase();
    return _vehicleCategoryMap[key] ?? 'leisure';
  }

  /// Returns the price multiplier for a given category.
  static double getMultiplier(String category) {
    return category == 'heavy' ? heavyMultiplier : leisureMultiplier;
  }

  // ─── calculatePrice() ────────────────────────────────────────────────────────
  /// Week 3 Task 4: Basic Pricing Engine.
  ///
  /// Formula: base + (distanceKm * perKm * multiplier)
  ///   Leisure: 250 + (km * 5 * 1.0)
  ///   Heavy:   250 + (km * 5 * 1.5)
  static double calculatePrice({
    required String vehicleType,
    required double distanceKm,
  }) {
    final category = getCategory(vehicleType);
    final multiplier = getMultiplier(category);
    return base + (distanceKm * perKm * multiplier);
  }

  /// Returns a human-readable category label.
  static String getCategoryLabel(String category) {
    switch (category) {
      case 'leisure':
        return 'Leisure / Standard';
      case 'heavy':
        return 'Heavy / Industrial';
      default:
        return 'Standard';
    }
  }

  // ─── Supported vehicle types by service ──────────────────────────────────────

  static const List<String> towVehicleTypes = [
    'Sedan',
    'SUV',
    '4x4',
    'Motorcycle',
    'ATV',
  ];

  static const List<String> heavyItemTypes = [
    'Precast Block',
    'Pallets/Bricks',
    'Container',
    'Generator',
  ];

  static const List<String> repairIssueTypes = [
    'Engine Problem',
    'Flat Tyre',
    'Battery Dead',
    'Brakes Failure',
    'Electrical Issue',
    'Other',
  ];
}
