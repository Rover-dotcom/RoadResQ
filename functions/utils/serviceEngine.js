/**
 * Service Engine — RoadResQ (Final Service Structure)
 *
 * SERVICE STRUCTURE (FINAL — Boss Approved):
 *
 * 1. Tow              → Sedan / SUV / 4x4 / Motorcycle / ATV / Others
 * 2. Garage           → Urgent (auto-dispatch) / Standard (quote)
 * 3. Heavy Equipment  → Skid Loader / JCB / Excavator / Telehandler / Others
 * 4. Quote Industrial → Precast / Pallets / Container / Generator / Others
 *
 * Each vehicle type maps to:
 *   - A service category
 *   - A required truck/transport type
 *   - An estimated vehicle weight (for capacity matching)
 *   - Whether auto-pricing applies or a quote is required
 */

// ─── SERVICE CATEGORIES ───────────────────────────────────────────────────────

const SERVICE_TYPES = {
  TOW: 'tow',
  GARAGE: 'garage',
  HEAVY_EQUIPMENT: 'heavy_equipment',
  QUOTE_INDUSTRIAL: 'quote_industrial',
};

// ─── TRUCK / TRANSPORT TYPES ──────────────────────────────────────────────────
// Used to match the right driver to the right job

const TRUCK_TYPES = {
  LIGHT_TOW: 'light_tow',           // Motorcycles, ATVs
  STANDARD_TOW: 'standard_tow',     // Sedans, SUVs
  HEAVY_TOW: 'heavy_tow',           // 4x4, Pickups, Large SUVs
  FLATBED_SMALL: 'flatbed_small',    // Skid Loaders (up to 5 tons)
  FLATBED_HEAVY: 'flatbed_heavy',    // JCB, Excavator, Telehandler (5–20 tons)
  SERVICE_VAN: 'service_van',        // Garage / on-site repair
  QUOTE_REQUIRED: 'quote_required',  // Needs manual assignment
};

// ─── VEHICLE SPECIFICATIONS ───────────────────────────────────────────────────
// estimatedWeightKg: typical vehicle/equipment weight
// requiredTruckType: minimum truck type needed to transport
// minTruckCapacityKg: minimum carrying capacity of the driver's truck
// priceKey: links to pricingEngine pricing table
// requiresQuote: if true, no auto-price — goes straight to quote flow

const VEHICLE_SPECS = {
  // ─── TOW SERVICE ────────────────────────────────────────
  Motorcycle: {
    serviceType: SERVICE_TYPES.TOW,
    requiredTruckType: TRUCK_TYPES.LIGHT_TOW,
    estimatedWeightKg: 200,
    minTruckCapacityKg: 300,
    priceKey: 'motorcycle',
    requiresQuote: false,
  },
  ATV: {
    serviceType: SERVICE_TYPES.TOW,
    requiredTruckType: TRUCK_TYPES.LIGHT_TOW,
    estimatedWeightKg: 400,
    minTruckCapacityKg: 500,
    priceKey: 'atv',
    requiresQuote: false,
  },
  Sedan: {
    serviceType: SERVICE_TYPES.TOW,
    requiredTruckType: TRUCK_TYPES.STANDARD_TOW,
    estimatedWeightKg: 1400,
    minTruckCapacityKg: 2000,
    priceKey: 'sedan',
    requiresQuote: false,
  },
  SUV: {
    serviceType: SERVICE_TYPES.TOW,
    requiredTruckType: TRUCK_TYPES.STANDARD_TOW,
    estimatedWeightKg: 2000,
    minTruckCapacityKg: 2500,
    priceKey: 'suv',
    requiresQuote: false,
  },
  '4x4': {
    serviceType: SERVICE_TYPES.TOW,
    requiredTruckType: TRUCK_TYPES.HEAVY_TOW,
    estimatedWeightKg: 2800,
    minTruckCapacityKg: 3500,
    priceKey: '4x4',
    requiresQuote: false,
  },
  'Tow Others': {
    serviceType: SERVICE_TYPES.TOW,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
  },

  // ─── HEAVY EQUIPMENT SERVICE ─────────────────────────────
  'Skid Loader': {
    serviceType: SERVICE_TYPES.HEAVY_EQUIPMENT,
    requiredTruckType: TRUCK_TYPES.FLATBED_SMALL,
    estimatedWeightKg: 3500,
    minTruckCapacityKg: 5000,
    priceKey: 'skid_loader',
    requiresQuote: false,
  },
  Telehandler: {
    serviceType: SERVICE_TYPES.HEAVY_EQUIPMENT,
    requiredTruckType: TRUCK_TYPES.FLATBED_HEAVY,
    estimatedWeightKg: 6000,
    minTruckCapacityKg: 8000,
    priceKey: 'telehandler',
    requiresQuote: false,
  },
  JCB: {
    serviceType: SERVICE_TYPES.HEAVY_EQUIPMENT,
    requiredTruckType: TRUCK_TYPES.FLATBED_HEAVY,
    estimatedWeightKg: 7500,
    minTruckCapacityKg: 10000,
    priceKey: 'jcb',
    requiresQuote: false,
  },
  Excavator: {
    serviceType: SERVICE_TYPES.HEAVY_EQUIPMENT,
    requiredTruckType: TRUCK_TYPES.FLATBED_HEAVY,
    estimatedWeightKg: 12000,
    minTruckCapacityKg: 15000,
    priceKey: 'excavator',
    requiresQuote: false,
  },
  'Heavy Others': {
    serviceType: SERVICE_TYPES.HEAVY_EQUIPMENT,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
  },

  // ─── QUOTE INDUSTRIAL SERVICE ─────────────────────────────
  'Precast Block': {
    serviceType: SERVICE_TYPES.QUOTE_INDUSTRIAL,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
  },
  Pallets: {
    serviceType: SERVICE_TYPES.QUOTE_INDUSTRIAL,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
  },
  Container: {
    serviceType: SERVICE_TYPES.QUOTE_INDUSTRIAL,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
  },
  Generator: {
    serviceType: SERVICE_TYPES.QUOTE_INDUSTRIAL,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
  },
  'Industrial Others': {
    serviceType: SERVICE_TYPES.QUOTE_INDUSTRIAL,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
  },
};

// ─── GARAGE SERVICE (SPECIAL CASE) ───────────────────────────────────────────
// Garage doesn't use vehicleType — it uses urgency level

const GARAGE_SPECS = {
  urgent: {
    serviceType: SERVICE_TYPES.GARAGE,
    requiredTruckType: TRUCK_TYPES.SERVICE_VAN,
    priceKey: 'garage_urgent',
    requiresQuote: false,
    description: 'Immediate dispatch — mechanic sent to location',
  },
  standard: {
    serviceType: SERVICE_TYPES.GARAGE,
    requiredTruckType: TRUCK_TYPES.SERVICE_VAN,
    priceKey: null,
    requiresQuote: true,
    description: 'Non-urgent — goes to quote flow, user selects garage',
  },
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get vehicle specification by name.
 * Case-insensitive, fuzzy match.
 */
function getVehicleSpec(vehicleType) {
  if (!vehicleType) return null;
  const key = Object.keys(VEHICLE_SPECS).find(
    (k) => k.toLowerCase() === vehicleType.trim().toLowerCase()
  );
  return key ? VEHICLE_SPECS[key] : null;
}

/**
 * Get the service category for a given vehicle type.
 * Returns one of: 'tow' | 'heavy_equipment' | 'quote_industrial' | 'garage'
 */
function getServiceCategory(vehicleType) {
  const spec = getVehicleSpec(vehicleType);
  return spec ? spec.serviceType : SERVICE_TYPES.QUOTE_INDUSTRIAL;
}

/**
 * Get the required truck type for a given vehicle type.
 */
function getRequiredTruckType(vehicleType) {
  const spec = getVehicleSpec(vehicleType);
  return spec ? spec.requiredTruckType : TRUCK_TYPES.QUOTE_REQUIRED;
}

/**
 * Check if a job for this vehicle type requires a manual quote.
 */
function requiresQuote(vehicleType) {
  const spec = getVehicleSpec(vehicleType);
  return spec ? spec.requiresQuote : true;
}

/**
 * Get compatible truck types for a vehicle.
 * A heavy_tow truck can also handle standard_tow and light_tow.
 * Returns array of acceptable truck types (ordered by preference).
 */
function getCompatibleTruckTypes(requiredTruckType) {
  const upgradeMap = {
    [TRUCK_TYPES.LIGHT_TOW]: [
      TRUCK_TYPES.LIGHT_TOW,
      TRUCK_TYPES.STANDARD_TOW,
      TRUCK_TYPES.HEAVY_TOW,
    ],
    [TRUCK_TYPES.STANDARD_TOW]: [
      TRUCK_TYPES.STANDARD_TOW,
      TRUCK_TYPES.HEAVY_TOW,
    ],
    [TRUCK_TYPES.HEAVY_TOW]: [TRUCK_TYPES.HEAVY_TOW],
    [TRUCK_TYPES.FLATBED_SMALL]: [
      TRUCK_TYPES.FLATBED_SMALL,
      TRUCK_TYPES.FLATBED_HEAVY,
    ],
    [TRUCK_TYPES.FLATBED_HEAVY]: [TRUCK_TYPES.FLATBED_HEAVY],
    [TRUCK_TYPES.SERVICE_VAN]: [TRUCK_TYPES.SERVICE_VAN],
    [TRUCK_TYPES.QUOTE_REQUIRED]: [TRUCK_TYPES.QUOTE_REQUIRED],
  };
  return upgradeMap[requiredTruckType] || [requiredTruckType];
}

/**
 * All valid vehicle/item names for validation.
 */
const ALL_VEHICLE_TYPES = Object.keys(VEHICLE_SPECS);
const TOW_VEHICLES = Object.keys(VEHICLE_SPECS).filter(
  (k) => VEHICLE_SPECS[k].serviceType === SERVICE_TYPES.TOW
);
const HEAVY_EQUIPMENT_TYPES = Object.keys(VEHICLE_SPECS).filter(
  (k) => VEHICLE_SPECS[k].serviceType === SERVICE_TYPES.HEAVY_EQUIPMENT
);
const INDUSTRIAL_TYPES = Object.keys(VEHICLE_SPECS).filter(
  (k) => VEHICLE_SPECS[k].serviceType === SERVICE_TYPES.QUOTE_INDUSTRIAL
);

module.exports = {
  SERVICE_TYPES,
  TRUCK_TYPES,
  VEHICLE_SPECS,
  GARAGE_SPECS,
  getVehicleSpec,
  getServiceCategory,
  getRequiredTruckType,
  requiresQuote,
  getCompatibleTruckTypes,
  ALL_VEHICLE_TYPES,
  TOW_VEHICLES,
  HEAVY_EQUIPMENT_TYPES,
  INDUSTRIAL_TYPES,
};
