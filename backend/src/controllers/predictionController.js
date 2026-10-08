/**
 * controllers/predictionController.js — Express Controller for AI Prediction Endpoint
 * Interacts with predictionService & MySQL telemetry to generate energy predictions.
 */

import { query } from '../config/db.js';
import { predictEnergyConsumption } from '../services/ml/predictionService.js';
import { getBuildingTargetEncoding } from '../services/ml/featureBuilder.js';

/**
 * Helper to fetch building square footage and recent telemetry from MySQL.
 */
async function fetchBuildingMetadataAndTelemetry(buildingId, targetTimestamp) {
  let squareFeet = 7432.0;
  let bldgDbId = null;

  const BUILDING_SQFT = { 1: 7432, 2: 12500, 3: 18200, 4: 9800, 5: 22000, 6: 15400, 7: 31000, 8: 34500 };
  if (BUILDING_SQFT[buildingId]) {
    squareFeet = BUILDING_SQFT[buildingId];
  }

  // 1. Fetch building database ID
  try {
    const bldgRows = await query(
      `SELECT id FROM buildings WHERE id = ? OR building_code = ? LIMIT 1;`,
      [buildingId, buildingId]
    );
    if (bldgRows && bldgRows.length > 0) {
      bldgDbId = bldgRows[0].id;
      if (BUILDING_SQFT[bldgDbId]) {
        squareFeet = BUILDING_SQFT[bldgDbId];
      }
    }
  } catch (e) {
    console.warn(`[ML Controller] Building lookup warning: ${e.message}`);
  }

  // 2. Fetch historical lag values from energy_readings if available
  let lag1h = null;
  let lag24h = null;
  let rollingMean24h = null;

  if (bldgDbId) {
    try {
      const targetDate = targetTimestamp ? new Date(targetTimestamp) : new Date();

      // Query latest 24 hours of readings prior to target date
      const readings = await query(
        `SELECT er.energy_consumed_kwh AS kwh_consumed, er.power_kw, er.reading_date AS recorded_at 
         FROM energy_consumption er
         WHERE er.building_id = ? AND er.reading_date <= ?
         ORDER BY er.reading_date DESC
         LIMIT 24;`,
        [bldgDbId, targetDate]
      );

      if (readings && readings.length > 0) {
        lag1h = parseFloat(readings[0].kwh_consumed || readings[0].power_kw);
        
        const sum = readings.reduce((acc, r) => acc + parseFloat(r.kwh_consumed || r.power_kw || 0), 0);
        rollingMean24h = sum / readings.length;

        if (readings.length >= 24) {
          lag24h = parseFloat(readings[readings.length - 1].kwh_consumed || readings[readings.length - 1].power_kw);
        } else {
          lag24h = lag1h;
        }
      }
    } catch (e) {
      console.warn(`[ML Controller] Telemetry lag lookup warning: ${e.message}`);
    }
  }

  return {
    squareFeet,
    lag1h,
    lag24h,
    rollingMean24h
  };
}

/**
 * POST /api/ai-prediction/predict
 * Generates energy consumption prediction for a building & timestamp using trained Linear Regression.
 */
export const handlePredictEnergy = async (req, res, next) => {
  try {
    const {
      building_id,
      timestamp,
      air_temperature,
      dew_temperature,
      wind_speed,
      square_feet,
      lag_1h,
      lag_24h,
      rolling_mean_24h
    } = req.body;

    if (building_id === undefined && req.body.buildingId === undefined) {
      return res.status(400).json({
        success: false,
        message: "Required parameter 'building_id' is missing."
      });
    }

    const bId = building_id !== undefined ? building_id : req.body.buildingId;

    // HOD Role Access Security Check
    if (req.user && req.user.role === 'Department Staff (HOD)') {
      if (req.user.building_id && String(req.user.building_id) !== String(bId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. HOD users can only generate predictions for their assigned building.'
        });
      }
    }

    // Fetch telemetry & metadata from MySQL
    const dbData = await fetchBuildingMetadataAndTelemetry(bId, timestamp);

    // Merge parameters with MySQL database fallback values
    const finalSquareFeet = square_feet !== undefined ? parseFloat(square_feet) : dbData.squareFeet;
    const finalLag1h = lag_1h !== undefined ? parseFloat(lag_1h) : (dbData.lag1h !== null ? dbData.lag1h : 250.0);
    const finalLag24h = lag_24h !== undefined ? parseFloat(lag_24h) : (dbData.lag24h !== null ? dbData.lag24h : finalLag1h);
    const finalRollingMean = rolling_mean_24h !== undefined ? parseFloat(rolling_mean_24h) : (dbData.rollingMean24h !== null ? dbData.rollingMean24h : finalLag1h);

    const inputData = {
      building_id: bId,
      timestamp: timestamp || new Date().toISOString(),
      square_feet: finalSquareFeet,
      air_temperature: air_temperature !== undefined ? parseFloat(air_temperature) : 20.0,
      dew_temperature: dew_temperature !== undefined ? parseFloat(dew_temperature) : 15.0,
      wind_speed: wind_speed !== undefined ? parseFloat(wind_speed) : 3.0,
      lag_1h: finalLag1h,
      lag_24h: finalLag24h,
      rolling_mean_24h: finalRollingMean
    };

    // Run Node.js Linear Regression Prediction
    const predictionResult = predictEnergyConsumption(inputData);

    return res.json({
      success: true,
      message: 'AI Energy Consumption Prediction Generated Successfully',
      data: {
        building_id: bId,
        timestamp: inputData.timestamp,
        predictedLog: predictionResult.predictedLog,
        predictedKwh: predictionResult.predictedKwh,
        model: predictionResult.model,
        target: predictionResult.target,
        unit: predictionResult.unit,
        inputs: {
          square_feet: finalSquareFeet,
          air_temperature: inputData.air_temperature,
          dew_temperature: inputData.dew_temperature,
          wind_speed: inputData.wind_speed,
          lag_1h: finalLag1h,
          lag_24h: finalLag24h,
          rolling_mean_24h: finalRollingMean,
          building_target_enc: getBuildingTargetEncoding(bId)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  handlePredictEnergy
};
