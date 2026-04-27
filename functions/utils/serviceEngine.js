/**
 * Service Engine — RoadResQ (v3.1.0)
 *
 * SERVICE STRUCTURE:
 *   1. Tow              → Sedan / SUV / 4x4 / Motorcycle / ATV / Others
 *   2. Garage           → Urgent (auto-dispatch) / Standard (quote)
 *   3. Heavy Equipment  → Skid Loader / JCB / Excavator / Telehandler / Others
 *   4. Quote Industrial → Precast / Pallets / Container / Generator / Others
 *
 * Each vehicle type maps to:
 *   - serviceType           : which service category
 *   - requiredTruckType     : minimum truck type needed
 *   - requiredEquipmentTypes: which driver equipment must be present (ANY ONE qualifies)
 *   - estimatedWeightKg     : typical weight for capacity matching
 *   - minTruckCapacityKg    : minimum driver truck payload rating
 *   - isSpecialLoad         : true → expert-only drivers (≥2yr experience)
 *   - requiresQuote         : true → no auto-price, goes to quote flow
 *   - label                 : human-readable name sent to the customer
 */

// ─── SERVICE CATEGORIES ───────────────────────────────────────────────────────

const SERVICE_TYPES = {
  TOW: 'tow',
  GARAGE: 'garage',
  HEAVY_EQUIPMENT: 'heavy_equipment',
  QUOTE_INDUSTRIAL: 'quote_industrial',
};

// ─── TRUCK / TRANSPORT TYPES ──────────────────────────────────────────────────

const TRUCK_TYPES = {
  LIGHT_TOW: 'light_tow',           // Motorcycles, ATVs   (≤500 kg)
  STANDARD_TOW: 'standard_tow',     // Sedans, SUVs        (≤2,500 kg)
  HEAVY_TOW: 'heavy_tow',           // 4x4, Pickups        (≤4,000 kg)
  FLATBED_SMALL: 'flatbed_small',    // Skid Loaders        (≤5 tons)
  FLATBED_HEAVY: 'flatbed_heavy',    // JCB, Excavator, Telehandler (5–20 tons)
  SERVICE_VAN: 'service_van',        // Garage / on-site repair
  QUOTE_REQUIRED: 'quote_required',  // Needs manual assignment
};

// ─── EQUIPMENT TYPES (driver capability flags) ────────────────────────────────
//
//  boom_truck   — crane arm on the truck; can lift and load from ground level
//  flatbed      — flat platform, load via ramps or crane; standard heavy transport
//  flatbed_tow  — flatbed with integrated tow winch; can drag-load smaller machinery
//
// For tow trucks carrying normal vehicles: no equipment type needed (vehicle is
// winched up normally). For heavy equipment the driver must have a matching type.

// ─── VEHICLE SPECIFICATIONS ───────────────────────────────────────────────────

const VEHICLE_SPECS = {

  // ─── TOW SERVICE ──────────────────────────────────────────────────────────
  // Normal vehicles are winched onto the tow truck — no special equipment needed.

  Motorcycle: {
    label: 'Motorcycle',
    serviceType: SERVICE_TYPES.TOW,
    requiredTruckType: TRUCK_TYPES.LIGHT_TOW,
    requiredEquipmentTypes: [],        // light tow truck handles it natively
    estimatedWeightKg: 200,
    minTruckCapacityKg: 300,
    priceKey: 'motorcycle',
    requiresQuote: false,
    isSpecialLoad: false,
  },
  ATV: {
    label: 'ATV / Quad Bike',
    serviceType: SERVICE_TYPES.TOW,
    requiredTruckType: TRUCK_TYPES.LIGHT_TOW,
    requiredEquipmentTypes: [],
    estimatedWeightKg: 400,
    minTruckCapacityKg: 500,
    priceKey: 'atv',
    requiresQuote: false,
    isSpecialLoad: false,
  },
  Sedan: {
    label: 'Sedan / Hatchback',
    serviceType: SERVICE_TYPES.TOW,
    requiredTruckType: TRUCK_TYPES.STANDARD_TOW,
    requiredEquipmentTypes: [],
    estimatedWeightKg: 1400,
    minTruckCapacityKg: 2000,
    priceKey: 'sedan',
    requiresQuote: false,
    isSpecialLoad: false,
  },
  SUV: {
    label: 'SUV / Crossover',
    serviceType: SERVICE_TYPES.TOW,
    requiredTruckType: TRUCK_TYPES.STANDARD_TOW,
    requiredEquipmentTypes: [],
    estimatedWeightKg: 2000,
    minTruckCapacityKg: 2500,
    priceKey: 'suv',
    requiresQuote: false,
    isSpecialLoad: false,
  },
  '4x4': {
    label: '4x4 / Pickup Truck',
    serviceType: SERVICE_TYPES.TOW,
    requiredTruckType: TRUCK_TYPES.HEAVY_TOW,
    requiredEquipmentTypes: [],
    estimatedWeightKg: 2800,
    minTruckCapacityKg: 3500,
    priceKey: '4x4',
    requiresQuote: false,
    isSpecialLoad: false,
  },
  'Tow Others': {
    label: 'Custom Vehicle (Tow)',
    serviceType: SERVICE_TYPES.TOW,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    requiredEquipmentTypes: [],
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
    isSpecialLoad: false,
  },

  // ─── HEAVY EQUIPMENT SERVICE ───────────────────────────────────────────────
  // Construction machinery — must be driven/rolled onto a flatbed.
  // Drivers MUST have the right equipment type to load it safely.

  'Skid Loader': {
    label: 'Skid Steer Loader',
    serviceType: SERVICE_TYPES.HEAVY_EQUIPMENT,
    requiredTruckType: TRUCK_TYPES.FLATBED_SMALL,
    // Skid loader rolls up a ramp → flatbed_tow or flatbed both work
    requiredEquipmentTypes: ['flatbed_tow', 'flatbed'],
    estimatedWeightKg: 3500,
    minTruckCapacityKg: 5000,
    priceKey: 'skid_loader',
    requiresQuote: false,
    isSpecialLoad: true,
  },
  Telehandler: {
    label: 'Telehandler (Reach Forklift)',
    serviceType: SERVICE_TYPES.HEAVY_EQUIPMENT,
    requiredTruckType: TRUCK_TYPES.FLATBED_HEAVY,
    // Telehandler is tall and heavy → needs heavy flatbed with ramps
    requiredEquipmentTypes: ['flatbed', 'flatbed_tow'],
    estimatedWeightKg: 6000,
    minTruckCapacityKg: 8000,
    priceKey: 'telehandler',
    requiresQuote: false,
    isSpecialLoad: true,
  },
  JCB: {
    label: 'JCB Backhoe Loader',
    serviceType: SERVICE_TYPES.HEAVY_EQUIPMENT,
    requiredTruckType: TRUCK_TYPES.FLATBED_HEAVY,
    // JCB can self-load via its arm, or be loaded by a boom truck
    requiredEquipmentTypes: ['flatbed', 'boom_truck'],
    estimatedWeightKg: 7500,
    minTruckCapacityKg: 10000,
    priceKey: 'jcb',
    requiresQuote: false,
    isSpecialLoad: true,
  },
  Excavator: {
    label: 'Excavator',
    serviceType: SERVICE_TYPES.HEAVY_EQUIPMENT,
    requiredTruckType: TRUCK_TYPES.FLATBED_HEAVY,
    // Excavator (12+ tons) — must have boom_truck for assisted loading
    requiredEquipmentTypes: ['boom_truck', 'flatbed'],
    estimatedWeightKg: 12000,
    minTruckCapacityKg: 15000,
    priceKey: 'excavator',
    requiresQuote: false,
    isSpecialLoad: true,
  },
  'Heavy Others': {
    label: 'Custom Heavy Equipment',
    serviceType: SERVICE_TYPES.HEAVY_EQUIPMENT,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    requiredEquipmentTypes: [],
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
    isSpecialLoad: true,
  },

  // ─── QUOTE INDUSTRIAL SERVICE ──────────────────────────────────────────────
  // All require custom quote + specific equipment at the matched driver level.

  'Precast Block': {
    label: 'Precast Concrete Block',
    serviceType: SERVICE_TYPES.QUOTE_INDUSTRIAL,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    requiredEquipmentTypes: ['boom_truck', 'flatbed'],
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
    isSpecialLoad: true,
  },
  Pallets: {
    label: 'Pallet Load',
    serviceType: SERVICE_TYPES.QUOTE_INDUSTRIAL,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    requiredEquipmentTypes: ['flatbed', 'boom_truck'],
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
    isSpecialLoad: true,
  },
  Container: {
    label: 'Shipping Container',
    serviceType: SERVICE_TYPES.QUOTE_INDUSTRIAL,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    // Containers are heavy and awkward — must have boom_truck
    requiredEquipmentTypes: ['boom_truck'],
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
    isSpecialLoad: true,
  },
  Generator: {
    label: 'Industrial Generator',
    serviceType: SERVICE_TYPES.QUOTE_INDUSTRIAL,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    requiredEquipmentTypes: ['boom_truck', 'flatbed'],
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
    isSpecialLoad: true,
  },
  'Industrial Others': {
    label: 'Custom Industrial Load',
    serviceType: SERVICE_TYPES.QUOTE_INDUSTRIAL,
    requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
    requiredEquipmentTypes: [],
    estimatedWeightKg: null,
    minTruckCapacityKg: null,
    priceKey: null,
    requiresQuote: true,
    isSpecialLoad: true,
  },
};

// ─── GARAGE SERVICE ────────────────────────────────────────────────────────────
// Garage uses urgency, not vehicleType

const GARAGE_SPECS = {
  urgent: {
    label: 'Urgent On-Site Repair',
    serviceType: SERVICE_TYPES.GARAGE,
    requiredTruckType: TRUCK_TYPES.SERVICE_VAN,
    requiredEquipmentTypes: [],
    priceKey: 'garage_urgent',
    requiresQuote: false,
    isSpecialLoad: false,
    description: 'Immediate dispatch — mechanic sent to location',
  },
  standard: {
    label: 'Standard Garage Service',
    serviceType: SERVICE_TYPES.GARAGE,
    requiredTruckType: TRUCK_TYPES.SERVICE_VAN,
    requiredEquipmentTypes: [],
    priceKey: null,
    requiresQuote: true,
    isSpecialLoad: false,
    description: 'Non-urgent — goes to quote flow, user selects garage',
  },
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get vehicle specification by name. Case-insensitive.
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
 * Get the required equipment types for a vehicle type.
 * Returns an array — driver needs ANY ONE of these in their equipmentTypes[].
 * Returns [] for vehicle types that need no special equipment (e.g. standard tow).
 */
function getRequiredEquipmentTypes(vehicleType) {
  const spec = getVehicleSpec(vehicleType);
  return spec ? (spec.requiredEquipmentTypes || []) : [];
}

/**
 * Check if a job for this vehicle type requires a manual quote.
 */
function requiresQuote(vehicleType) {
  const spec = getVehicleSpec(vehicleType);
  return spec ? spec.requiresQuote : true;
}

/**
 * ─── DERIVE JOB CONSTRAINTS ───────────────────────────────────────────────────
 *
 * Single source of truth. Given only a vehicleType (and optional customer
 * overrides like clearanceHeightMm), returns everything the matching engine
 * needs to find the right driver.
 *
 * The customer does NOT need to specify truck type, equipment type, etc.
 * The system figures it all out here.
 *
 * @param {string} vehicleType         - e.g. 'Excavator', 'Sedan', 'JCB'
 * @param {object} [overrides={}]      - fields from job body that override
 *                                       (e.g. clearanceHeightMm, requiresGatePass)
 * @returns {object} Full constraint set for findMatchingDrivers()
 */
function deriveJobConstraints(vehicleType, overrides = {}) {
  const spec = getVehicleSpec(vehicleType);

  if (!spec) {
    // Unknown / custom vehicle → safest defaults, require quote
    return {
      serviceType: SERVICE_TYPES.QUOTE_INDUSTRIAL,
      requiredTruckType: TRUCK_TYPES.QUOTE_REQUIRED,
      minTruckCapacityKg: 0,
      requiredEquipmentTypes: [],
      isSpecialLoad: overrides.isSpecialLoad || false,
      requiresQuote: true,
      vehicleLabel: vehicleType || 'Custom Vehicle',
      ...overrides,
    };
  }

  return {
    serviceType: spec.serviceType,
    requiredTruckType: spec.requiredTruckType,
    minTruckCapacityKg: spec.minTruckCapacityKg || 0,
    requiredEquipmentTypes: spec.requiredEquipmentTypes || [],
    isSpecialLoad: spec.isSpecialLoad || false,
    requiresQuote: spec.requiresQuote || false,
    vehicleLabel: spec.label || vehicleType,
    // Customer overrides always win (e.g. their site has unusual clearance)
    ...overrides,
  };
}

/**
 * Get compatible truck types for a required truck type.
 * Bigger truck → can handle smaller-truck jobs (upgrade path).
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

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

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
  getRequiredEquipmentTypes,
  requiresQuote,
  getCompatibleTruckTypes,
  deriveJobConstraints,
  ALL_VEHICLE_TYPES,
  TOW_VEHICLES,
  HEAVY_EQUIPMENT_TYPES,
  INDUSTRIAL_TYPES,
};
