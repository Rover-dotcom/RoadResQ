/**
 * Pricing Engine — RoadResQ (Week 4)
 *
 * INTEGER PRICING: All prices stored as integers in QR halala (smallest unit).
 *   5000 = QR 50.00  (divide by 100 for display)
 *
 * Vehicle-specific pricing — each vehicle has its own base fare + per-km rate.
 * Garage urgent → flat call-out fee + per-km travel.
 * Quote Industrial → no auto-price (manual or bidding).
 *
 * TRAFFIC BUFFER:
 *   Peak hours (Qatar): ETA × 1.25 (25% buffer added automatically)
 */

// ─── PRICING TABLE (stored in halala: integer, divide by 100 for QR display) ──

const PRICING_TABLE = {
  // ─── TOW SERVICE ─────────────────────────────────────────────────────────────
  motorcycle: {
    label: 'Motorcycle Tow',
    baseFare: 15000,    // QR 150.00
    perKm: 300,         // QR 3.00 per km
    currency: 'QAR',
    note: 'Light tow truck, single bike capacity',
  },
  atv: {
    label: 'ATV Tow',
    baseFare: 18000,    // QR 180.00
    perKm: 400,         // QR 4.00 per km
    currency: 'QAR',
    note: 'Light tow truck with ATV platform',
  },
  sedan: {
    label: 'Sedan Tow',
    baseFare: 25000,    // QR 250.00
    perKm: 500,         // QR 5.00 per km
    currency: 'QAR',
    note: 'Standard flatbed/wheel-lift tow',
  },
  suv: {
    label: 'SUV Tow',
    baseFare: 30000,    // QR 300.00
    perKm: 600,         // QR 6.00 per km
    currency: 'QAR',
    note: 'Standard flatbed tow — higher capacity for SUV weight',
  },
  '4x4': {
    label: '4x4 / Pickup Tow',
    baseFare: 38000,    // QR 380.00
    perKm: 800,         // QR 8.00 per km
    currency: 'QAR',
    note: 'Heavy tow truck required — 4x4 and large pickups',
  },

  // ─── HEAVY EQUIPMENT ─────────────────────────────────────────────────────────
  skid_loader: {
    label: 'Skid Loader Transport',
    baseFare: 80000,    // QR 800.00
    perKm: 1200,        // QR 12.00 per km
    currency: 'QAR',
    note: 'Flatbed trailer, up to 5 tons',
  },
  telehandler: {
    label: 'Telehandler Transport',
    baseFare: 120000,   // QR 1,200.00
    perKm: 1600,        // QR 16.00 per km
    currency: 'QAR',
    note: 'Heavy flatbed trailer, up to 8 tons',
  },
  jcb: {
    label: 'JCB / Backhoe Transport',
    baseFare: 150000,   // QR 1,500.00
    perKm: 1800,        // QR 18.00 per km
    currency: 'QAR',
    note: 'Heavy flatbed trailer, up to 10 tons',
  },
  excavator: {
    label: 'Excavator Transport',
    baseFare: 200000,   // QR 2,000.00
    perKm: 2200,        // QR 22.00 per km
    currency: 'QAR',
    note: 'Heavy duty flatbed + securing equipment, up to 15 tons',
  },

  // ─── GARAGE / REPAIR ─────────────────────────────────────────────────────────
  garage_urgent: {
    label: 'Urgent Garage Call-Out',
    baseFare: 30000,    // QR 300.00
    perKm: 500,         // QR 5.00 per km
    currency: 'QAR',
    note: 'Mechanic dispatched to your location + travel fee',
  },
  onsite_repair: {
    label: 'On-Site Repair',
    baseFare: 0,        // QR 0 — price is set by garage estimate
    perKm: 0,
    currency: 'QAR',
    note: 'Price determined by garage estimate after assessment',
  },

  // ─── NO-SHOW / PENALTY ───────────────────────────────────────────────────────
  noshow_penalty: {
    label: 'Customer No-Show Penalty',
    baseFare: 5000,     // QR 50.00
    perKm: 0,
    currency: 'QAR',
    note: 'Charged when customer does not respond for 10+ minutes',
  },
};

// ─── Helper: Convert integer halala to QR display string ──────────────────────

/**
 * Convert integer halala to human-readable QR amount.
 * @param {number} halala - integer amount (5000 = QR 50.00)
 * @returns {string} e.g. "QR 50.00"
 */
function toQRDisplay(halala) {
  if (halala == null) return null;
  return `QR ${(halala / 100).toFixed(2)}`;
}

/**
 * Convert QR decimal to integer halala for storage.
 * @param {number} qr - decimal QR (50.00)
 * @returns {number} integer halala (5000)
 */
function toHalala(qr) {
  return Math.round(parseFloat(qr) * 100);
}

// ─── Price Calculation ────────────────────────────────────────────────────────

/**
 * Calculate the price for a job.
 * All amounts stored/returned as integers (halala).
 *
 * @param {string} priceKey - Key from PRICING_TABLE
 * @param {number} distanceKm
 * @returns {{ price: number, currency: string, breakdown: object } | null}
 *   price is in integer halala (5000 = QR 50.00)
 */
function calculatePrice(priceKey, distanceKm = 5) {
  if (!priceKey) return null;

  const config = PRICING_TABLE[priceKey.toLowerCase()];
  if (!config) return null;

  const km = Math.max(0, parseFloat(distanceKm) || 5);
  const distanceCharge = Math.round(km * config.perKm);
  const total = config.baseFare + distanceCharge;

  return {
    price: total,                       // integer halala (5000 = QR 50.00)
    priceDisplay: toQRDisplay(total),   // "QR 50.00"
    currency: config.currency,
    breakdown: {
      label: config.label,
      baseFare: config.baseFare,
      baseFareDisplay: toQRDisplay(config.baseFare),
      distanceKm: km,
      perKm: config.perKm,
      perKmDisplay: toQRDisplay(config.perKm),
      distanceCharge,
      distanceChargeDisplay: toQRDisplay(distanceCharge),
      total,
      totalDisplay: toQRDisplay(total),
      note: config.note,
    },
  };
}

/**
 * Get the price estimate without creating a job.
 * Used by: GET /api/jobs/price-estimate
 */
function getPriceEstimate(vehicleType, distanceKm) {
  const { getVehicleSpec } = require('./serviceEngine');
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

module.exports = {
  PRICING_TABLE,
  calculatePrice,
  getPriceEstimate,
  toQRDisplay,
  toHalala,
};
