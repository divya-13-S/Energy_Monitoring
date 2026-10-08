/**
 * Unit Tests & Feature Audit for Node.js ML Integration
 */

import { FEATURE_ORDER, INTERCEPT, COEFFICIENTS, UPPER_LOG_BOUND } from './src/services/ml/linearRegressionModel.js';
import { buildFeatureVector, getBuildingTargetEncoding } from './src/services/ml/featureBuilder.js';
import { predictEnergyConsumption } from './src/services/ml/predictionService.js';

console.log("==================================================");
console.log("NODE.JS ML INTEGRATION COMPREHENSIVE UNIT TESTS");
console.log("==================================================");

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

// A. Feature ordering
assert(FEATURE_ORDER.length === 15, "A. Feature count is exactly 15");
assert(FEATURE_ORDER[0] === "sin_hour" && FEATURE_ORDER[14] === "building_target_enc", "A. Exact feature ordering preserved");

// B. StandardScaler & Linear Regression calculation
assert(typeof INTERCEPT === "number" && COEFFICIENTS.length === 15, "B. Model intercept and 15 coefficients loaded");

// C. Building target encoding
const encKnown = getBuildingTargetEncoding(0);
const encUnknown = getBuildingTargetEncoding(99999);
assert(encKnown > 0, "C. Known building returns positive target encoding");
assert(Math.abs(encUnknown - 4.3514255) < 0.001, "D. Unknown building falls back safely to global training log mean (4.3514)");

// E. Lower prediction bound
const zeroInput = { building_id: 0, lag_1h: 0, lag_24h: 0, rolling_mean_24h: 0, square_feet: 1 };
const resZero = predictEnergyConsumption(zeroInput);
assert(resZero.predictedLog >= 0.0, "E. Lower prediction bound log >= 0.0 enforced");
assert(resZero.predictedKwh >= 0.0, "E. Lower prediction bound kWh >= 0.0 enforced");

// F. Upper prediction bound
const extremeInput = { building_id: 993, lag_1h: 17999, square_feet: 428647 };
const resExtreme = predictEnergyConsumption(extremeInput);
assert(resExtreme.predictedLog <= UPPER_LOG_BOUND, `F. Upper prediction bound log <= ${UPPER_LOG_BOUND} enforced`);
assert(resExtreme.predictedKwh <= Math.exp(UPPER_LOG_BOUND) - 1.0, "F. Upper prediction bound kWh enforced");

// G. Python vs Node.js Prediction Equivalence (Case 1)
const case1 = {
  building_id: 0, sin_hour: 0.0, cos_hour: 1.0, sin_day_of_week: 0.0, cos_day_of_week: 1.0,
  is_weekend: 0, month: 11, day_of_year: 306, square_feet: 7432.0, air_temperature: 20.0,
  dew_temperature: 15.0, wind_speed: 3.0, lag_1h: 250.0, lag_24h: 240.0, rolling_mean_24h: 245.0
};
const res1 = predictEnergyConsumption(case1);
assert(Math.abs(res1.predictedKwh - 256.6234) <= 0.01, `G. Python vs Node.js prediction equivalence (Diff = ${Math.abs(res1.predictedKwh - 256.6234).toFixed(6)} kWh)`);

// H. Input Validation
try {
  predictEnergyConsumption([1, 2, 3]); // Invalid feature length
  assert(false, "H. Invalid feature vector length throws error");
} catch (e) {
  assert(true, "H. Invalid feature vector length throws error cleanly");
}

console.log("\n==================================================");
console.log(`UNIT TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log("==================================================");
