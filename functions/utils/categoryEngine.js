/**
 * categoryEngine.js — Compatibility shim
 * Re-exports from the new serviceEngine.js and pricingEngine.js.
 * Kept for any code that still imports from categoryEngine.js.
 */
const {
  SERVICE_TYPES,
  TRUCK_TYPES,
  VEHICLE_SPECS,
  getVehicleSpec,
  getServiceCategory,
  getRequiredTruckType,
  requiresQuote,
  getCompatibleTruckTypes,
  ALL_VEHICLE_TYPES,
  TOW_VEHICLES,
  HEAVY_EQUIPMENT_TYPES,
  INDUSTRIAL_TYPES,
} = require('./serviceEngine');

const { PRICING_TABLE, calculatePrice, getPriceEstimate } = require('./pricingEngine');

// Legacy aliases
const getCategory = getServiceCategory;
const VEHICLE_CATEGORY_MAP = VEHICLE_SPECS;

module.exports = {
  SERVICE_TYPES,
  TRUCK_TYPES,
  VEHICLE_SPECS,
  VEHICLE_CATEGORY_MAP,
  PRICING_TABLE,
  getVehicleSpec,
  getCategory,
  getServiceCategory,
  getRequiredTruckType,
  requiresQuote,
  getCompatibleTruckTypes,
  calculatePrice,
  getPriceEstimate,
  ALL_VEHICLE_TYPES,
  TOW_VEHICLES,
  HEAVY_EQUIPMENT_TYPES,
  INDUSTRIAL_TYPES,
};
