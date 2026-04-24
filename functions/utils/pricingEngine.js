/**
 * Pricing Engine — RoadResQ
 *
 * Vehicle-specific pricing — NOT just a heavy/leisure multiplier.
 * Each vehicle type has its own base fare and per-km rate
 * based on the truck size and complexity required.
 *
 * Garage urgent has a flat call-out fee + per-km travel.
 * Quote Industrial → no auto-price (manual admin quote always).
 */

const PRICING_TABLE = {
  // ─── TOW SERVICE ─────────────────────────────────────────────────────────────
  motorcycle: {
    label: 'Motorcycle Tow',
    baseFare: 150,
    perKm: 3,
    currency: 'PHP',
    note: 'Light tow truck, single bike capacity',
  },
  atv: {
    label: 'ATV Tow',
    baseFare: 180,
    perKm: 4,
    currency: 'PHP',
    note: 'Light tow truck with ATV platform',
  },
  sedan: {
    label: 'Sedan Tow',
    baseFare: 250,
    perKm: 5,
    currency: 'PHP',
    note: 'Standard flatbed/wheel-lift tow',
  },
  suv: {
    label: 'SUV Tow',
    baseFare: 300,
    perKm: 6,
    currency: 'PHP',
    note: 'Standard flatbed tow — higher capacity for SUV weight',
  },
  '4x4': {
    label: '4x4 / Pickup Tow',
    baseFare: 380,
    perKm: 8,
    currency: 'PHP',
    note: 'Heavy tow truck required — 4x4 and large pickups',
  },

  // ─── HEAVY EQUIPMENT ─────────────────────────────────────────────────────────
  skid_loader: {
    label: 'Skid Loader Transport',
    baseFare: 800,
    perKm: 12,
    currency: 'PHP',
    note: 'Flatbed trailer, up to 5 tons',
  },
  telehandler: {
    label: 'Telehandler Transport',
    baseFare: 1200,
    perKm: 16,
    currency: 'PHP',
    note: 'Heavy flatbed trailer, up to 8 tons',
  },
  jcb: {
    label: 'JCB / Backhoe Transport',
    baseFare: 1500,
    perKm: 18,
    currency: 'PHP',
    note: 'Heavy flatbed trailer, up to 10 tons',
  },
  excavator: {
    label: 'Excavator Transport',
    baseFare: 2000,
    perKm: 22,
    currency: 'PHP',
    note: 'Heavy duty flatbed + securing equipment, up to 15 tons',
  },

  // ─── GARAGE / REPAIR ─────────────────────────────────────────────────────────
  garage_urgent: {
    label: 'Urgent Garage Call-Out',
    baseFare: 300,
    perKm: 5,
    currency: 'PHP',
    note: 'Mechanic dispatched to your location + travel fee',
  },
};

/**
 * Calculate the price for a job.
 *
 * @param {string} priceKey - Key from PRICING_TABLE (e.g. 'sedan', 'jcb')
 * @param {number} distanceKm - Distance in km
 * @returns {{ price: number, breakdown: object } | null}
 *   Returns null if this vehicle type requires a quote.
 */
function calculatePrice(priceKey, distanceKm = 5) {
  if (!priceKey) return null;

  const config = PRICING_TABLE[priceKey.toLowerCase()];
  if (!config) return null;

  const km = Math.max(0, parseFloat(distanceKm) || 5);
  const distanceCharge = km * config.perKm;
  const total = config.baseFare + distanceCharge;

  return {
    price: Math.round(total * 100) / 100,
    currency: config.currency,
    breakdown: {
      label: config.label,
      baseFare: config.baseFare,
      distanceKm: km,
      perKm: config.perKm,
      distanceCharge: Math.round(distanceCharge * 100) / 100,
      total: Math.round(total * 100) / 100,
      note: config.note,
    },
  };
}

/**
 * Get the price estimate without creating a job.
 * Used by: GET /api/jobs/price-estimate
 */
function getPriceEstimate(vehicleType, distanceKm) {
  const { getVehicleSpec, GARAGE_SPECS } = require('./serviceEngine');
  const spec = getVehicleSpec(vehicleType);

  if (!spec) {
    return { requiresQuote: true, reason: 'Unknown vehicle type' };
  }

  if (spec.requiresQuote) {
    return {
      requiresQuote: true,
      reason: 'This item type requires a custom quote from our team.',
    };
  }

  const result = calculatePrice(spec.priceKey, distanceKm);
  if (!result) {
    return { requiresQuote: true, reason: 'Pricing not available for this type' };
  }

  return {
    requiresQuote: false,
    vehicleType,
    serviceType: spec.serviceType,
    requiredTruckType: spec.requiredTruckType,
    estimatedWeightKg: spec.estimatedWeightKg,
    ...result,
  };
}

module.exports = { PRICING_TABLE, calculatePrice, getPriceEstimate };
