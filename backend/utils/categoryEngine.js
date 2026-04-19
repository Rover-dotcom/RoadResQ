/**
 * Category Engine — Week 3 Task 1 (Backend)
 *
 * Maps vehicleType → category → price multiplier.
 *
 * Pricing (Week 3 spec):
 *   base          = 250
 *   perKm         = 5
 *   heavyMultiplier = 1.5
 *   leisureMultiplier = 1.0 (default)
 */

// ─── Pricing Constants ────────────────────────────────────────────────────────

const BASE = 250;
const PER_KM = 5;
const HEAVY_MULTIPLIER = 1.5;
const LEISURE_MULTIPLIER = 1.0;

// ─── Vehicle Type → Category Map ─────────────────────────────────────────────

const VEHICLE_CATEGORY_MAP = {
  // Tow — leisure category
  sedan: 'leisure',
  suv: 'leisure',
  '4x4': 'leisure',
  motorcycle: 'leisure',
  atv: 'leisure',

  // Heavy transport — heavy category
  'precast block': 'heavy',
  precast: 'heavy',
  pallets: 'heavy',
  'pallets/bricks': 'heavy',
  bricks: 'heavy',
  container: 'heavy',
  generator: 'heavy',
};

// ─── getCategory(vehicleType) ─────────────────────────────────────────────────

/**
 * Week 3 Task 1: Category Engine mapping logic.
 *
 * function getCategory(vehicleType) {
 *   // mapping logic
 * }
 *
 * Returns 'leisure' or 'heavy'. Defaults to 'leisure'.
 * @param {string} vehicleType
 * @returns {string} 'leisure' | 'heavy'
 */
function getCategory(vehicleType) {
  if (!vehicleType) return 'leisure';
  const key = vehicleType.trim().toLowerCase();
  return VEHICLE_CATEGORY_MAP[key] || 'leisure';
}

// ─── getMultiplier(category) ──────────────────────────────────────────────────

/**
 * Returns price multiplier for a category.
 * @param {string} category
 * @returns {number}
 */
function getMultiplier(category) {
  return category === 'heavy' ? HEAVY_MULTIPLIER : LEISURE_MULTIPLIER;
}

// ─── calculatePrice(vehicleType, distanceKm) ──────────────────────────────────

/**
 * Week 3 Task 4: Pricing Engine.
 *
 * Formula: base + (distanceKm * perKm * multiplier)
 *   Leisure: 250 + (km × 5 × 1.0)
 *   Heavy:   250 + (km × 5 × 1.5)
 *
 * @param {string} vehicleType
 * @param {number} distanceKm
 * @returns {number} Estimated price (rounded to 2 decimal places)
 */
function calculatePrice(vehicleType, distanceKm = 5) {
  const category = getCategory(vehicleType);
  const multiplier = getMultiplier(category);
  const price = BASE + distanceKm * PER_KM * multiplier;
  return Math.round(price * 100) / 100;
}

// ─── Supported lists (for validation) ────────────────────────────────────────

const TOW_VEHICLE_TYPES = ['Sedan', 'SUV', '4x4', 'Motorcycle', 'ATV'];
const HEAVY_ITEM_TYPES = ['Precast Block', 'Pallets/Bricks', 'Container', 'Generator'];
const SERVICE_TYPES = ['tow', 'repair', 'heavy', 'quote'];

module.exports = {
  getCategory,
  getMultiplier,
  calculatePrice,
  TOW_VEHICLE_TYPES,
  HEAVY_ITEM_TYPES,
  SERVICE_TYPES,
  BASE,
  PER_KM,
  HEAVY_MULTIPLIER,
};
