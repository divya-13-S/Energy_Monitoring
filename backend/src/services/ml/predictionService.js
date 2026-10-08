/**
 * Pure Node.js Prediction Service for Linear Regression ML Inference.
 * Mathematically reproduces scikit-learn Linear Regression & StandardScaler.
 */

import {
  MODEL_NAME,
  TARGET_VARIABLE,
  FEATURE_ORDER,
  INTERCEPT,
  COEFFICIENTS,
  SCALER_MEANS,
  SCALER_SCALES,
  UPPER_LOG_BOUND,
  LOWER_LOG_BOUND
} from './linearRegressionModel.js';

import { buildFeatureVector } from './featureBuilder.js';

/**
 * Predicts energy consumption for a single feature vector or input object.
 * 
 * @param {Object|Array<number>} inputData - Feature object or raw 15-element feature vector
 * @returns {Object} Structured prediction result
 */
export function predictEnergyConsumption(inputData) {
  let featureVector;
  if (Array.isArray(inputData)) {
    if (inputData.length !== FEATURE_ORDER.length) {
      throw new Error(`Invalid feature vector length. Expected ${FEATURE_ORDER.length}, received ${inputData.length}`);
    }
    featureVector = inputData;
  } else {
    featureVector = buildFeatureVector(inputData);
  }

  // 1. Standardize Features: (x - mean) / scale
  const scaledFeatures = featureVector.map((val, idx) => {
    return (val - SCALER_MEANS[idx]) / SCALER_SCALES[idx];
  });

  // 2. Linear Regression Prediction: y_log = intercept + sum(coef_i * scaled_i)
  let rawPredictedLog = INTERCEPT;
  for (let i = 0; i < COEFFICIENTS.length; i++) {
    rawPredictedLog += COEFFICIENTS[i] * scaledFeatures[i];
  }

  // 3. Apply Prediction Bounds: [0.0, UPPER_LOG_BOUND (11.786903)]
  let boundedLog = Math.max(LOWER_LOG_BOUND, rawPredictedLog);
  boundedLog = Math.min(UPPER_LOG_BOUND, boundedLog);

  // 4. Convert Log Prediction to kWh: exp(pred_log) - 1
  const predictedKwh = Math.max(0.0, Math.exp(boundedLog) - 1.0);

  return {
    predictedLog: Number(boundedLog.toFixed(6)),
    predictedKwh: Number(predictedKwh.toFixed(4)),
    model: MODEL_NAME,
    target: TARGET_VARIABLE,
    unit: "kWh"
  };
}

/**
 * Batch prediction helper.
 */
export function predictBatchEnergyConsumption(inputRows) {
  return inputRows.map(row => predictEnergyConsumption(row));
}

export default {
  predictEnergyConsumption,
  predictBatchEnergyConsumption
};
