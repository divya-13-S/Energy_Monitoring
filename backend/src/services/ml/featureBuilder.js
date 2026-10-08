/**
 * Feature Builder for Linear Regression ML Inference.
 * Builds the exact 15 feature vector matching training feature order.
 */

import {
  FEATURE_ORDER,
  BUILDING_TARGET_ENC_MAP,
  GLOBAL_FALLBACK_TARGET_ENC
} from './linearRegressionModel.js';

/**
 * Computes day of year for a Date object (1 - 366).
 */
export function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Returns building target encoding for a given building_id.
 */
export function getBuildingTargetEncoding(buildingId) {
  const bIdStr = String(buildingId);
  if (Object.prototype.hasOwnProperty.call(BUILDING_TARGET_ENC_MAP, bIdStr)) {
    return BUILDING_TARGET_ENC_MAP[bIdStr];
  }
  return GLOBAL_FALLBACK_TARGET_ENC;
}

/**
 * Builds the 15-feature array from input options in strict FEATURE_ORDER.
 * 
 * @param {Object} input - Raw input parameters
 * @returns {Array<number>} - 15-element array ordered according to FEATURE_ORDER
 */
export function buildFeatureVector(input) {
  const timestamp = input.timestamp ? new Date(input.timestamp) : new Date();
  
  const hour = input.hour !== undefined ? Number(input.hour) : timestamp.getHours();
  const jsDay = timestamp.getDay();
  const dayOfWeek = input.day_of_week !== undefined ? Number(input.day_of_week) : (jsDay === 0 ? 6 : jsDay - 1);
  const month = input.month !== undefined ? Number(input.month) : (timestamp.getMonth() + 1);
  const dayOfYear = input.day_of_year !== undefined ? Number(input.day_of_year) : getDayOfYear(timestamp);
  const isWeekend = input.is_weekend !== undefined ? Number(input.is_weekend) : (dayOfWeek >= 5 ? 1 : 0);

  // Exact cyclical formulas (or use pre-computed if explicitly provided)
  const sinHour = input.sin_hour !== undefined ? Number(input.sin_hour) : Math.sin((2 * Math.PI * hour) / 24.0);
  const cosHour = input.cos_hour !== undefined ? Number(input.cos_hour) : Math.cos((2 * Math.PI * hour) / 24.0);
  const sinDayOfWeek = input.sin_day_of_week !== undefined ? Number(input.sin_day_of_week) : Math.sin((2 * Math.PI * dayOfWeek) / 7.0);
  const cosDayOfWeek = input.cos_day_of_week !== undefined ? Number(input.cos_day_of_week) : Math.cos((2 * Math.PI * dayOfWeek) / 7.0);

  const squareFeet = Number(input.square_feet || input.total_area_sqft || 7432.0);
  const airTemperature = Number(input.air_temperature !== undefined ? input.air_temperature : 20.0);
  const dewTemperature = Number(input.dew_temperature !== undefined ? input.dew_temperature : 15.0);
  const windSpeed = Number(input.wind_speed !== undefined ? input.wind_speed : 3.0);

  const lag1h = Number(input.lag_1h !== undefined ? input.lag_1h : (input.current_kwh || 250.0));
  const lag24h = Number(input.lag_24h !== undefined ? input.lag_24h : lag1h);
  const rollingMean24h = Number(input.rolling_mean_24h !== undefined ? input.rolling_mean_24h : lag1h);

  const buildingTargetEnc = input.building_target_enc !== undefined
    ? Number(input.building_target_enc)
    : getBuildingTargetEncoding(input.building_id || 0);

  const featureMap = {
    sin_hour: sinHour,
    cos_hour: cosHour,
    sin_day_of_week: sinDayOfWeek,
    cos_day_of_week: cosDayOfWeek,
    is_weekend: isWeekend,
    month: month,
    day_of_year: dayOfYear,
    square_feet: squareFeet,
    air_temperature: airTemperature,
    dew_temperature: dewTemperature,
    wind_speed: windSpeed,
    lag_1h: lag1h,
    lag_24h: lag24h,
    rolling_mean_24h: rollingMean24h,
    building_target_enc: buildingTargetEnc
  };

  return FEATURE_ORDER.map(col => featureMap[col]);
}

export default {
  buildFeatureVector,
  getBuildingTargetEncoding,
  getDayOfYear
};
