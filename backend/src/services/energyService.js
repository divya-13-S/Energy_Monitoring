/**
 * services/energyService.js — Energy Domain Business Logic
 * Encapsulates telemetry calculations, tariff application, and KPI aggregation.
 */

export const calculateCost = (kwh, tariff = 8.5) => {
  return Math.round(kwh * tariff);
};

export const aggregateDailyReadings = (readings = []) => {
  return readings.reduce((sum, r) => sum + (Number(r.energyConsumption) || 0), 0);
};
