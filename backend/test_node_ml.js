import { predictEnergyConsumption } from './src/services/ml/predictionService.js';

console.log("==================================================");
console.log("NODE.JS ML INTEGRATION PREDICTION VALIDATION TEST");
console.log("==================================================");

// Case 1: Normal Consumption (Building 0)
const case1 = {
  building_id: 0,
  sin_hour: 0.0,
  cos_hour: 1.0,
  sin_day_of_week: 0.0,
  cos_day_of_week: 1.0,
  is_weekend: 0,
  month: 11,
  day_of_year: 306,
  square_feet: 7432.0,
  air_temperature: 20.0,
  dew_temperature: 15.0,
  wind_speed: 3.0,
  lag_1h: 250.0,
  lag_24h: 240.0,
  rolling_mean_24h: 245.0
};
const res1 = predictEnergyConsumption(case1);
console.log("\n1. NORMAL CONSUMPTION CASE (Building 0):");
console.log(`   Python Reference: 256.6234 kWh (Log: 5.551499)`);
console.log(`   Node.js Output:   ${res1.predictedKwh} kWh (Log: ${res1.predictedLog})`);
console.log(`   Abs Difference:   ${Math.abs(res1.predictedKwh - 256.6234).toFixed(6)} kWh`);

// Case 2: Moderate Consumption (Building 10)
const case2 = {
  building_id: 10,
  sin_hour: 0.707,
  cos_hour: 0.707,
  sin_day_of_week: 0.781,
  cos_day_of_week: 0.623,
  is_weekend: 0,
  month: 5,
  day_of_year: 140,
  square_feet: 50000.0,
  air_temperature: 22.0,
  dew_temperature: 16.0,
  wind_speed: 2.5,
  lag_1h: 1200.0,
  lag_24h: 1150.0,
  rolling_mean_24h: 1180.0
};
const res2 = predictEnergyConsumption(case2);
console.log("\n2. MODERATE CONSUMPTION CASE (Building 10):");
console.log(`   Python Reference: 124.5006 kWh (Log: 4.832310)`);
console.log(`   Node.js Output:   ${res2.predictedKwh} kWh (Log: ${res2.predictedLog})`);
console.log(`   Abs Difference:   ${Math.abs(res2.predictedKwh - 124.5006).toFixed(6)} kWh`);

// Case 3: High Consumption (Building 801)
const case3 = {
  building_id: 801,
  sin_hour: -0.5,
  cos_hour: -0.866,
  sin_day_of_week: 0.0,
  cos_day_of_week: 1.0,
  is_weekend: 0,
  month: 11,
  day_of_year: 320,
  square_feet: 484376.0,
  air_temperature: 25.0,
  dew_temperature: 18.0,
  wind_speed: 4.0,
  lag_1h: 6000.0,
  lag_24h: 5800.0,
  rolling_mean_24h: 5900.0
};
const res3 = predictEnergyConsumption(case3);
console.log("\n3. HIGH CONSUMPTION CASE (Building 801):");
console.log(`   Python Reference: 69549.3056 kWh (Log: 11.149806)`);
console.log(`   Node.js Output:   ${res3.predictedKwh} kWh (Log: ${res3.predictedLog})`);
console.log(`   Abs Difference:   ${Math.abs(res3.predictedKwh - 69549.3056).toFixed(6)} kWh`);

// Case 4: Extreme Lag Case (Building 993)
const case4 = {
  building_id: 993,
  sin_hour: 0.5,
  cos_hour: 0.866,
  sin_day_of_week: 0.0,
  cos_day_of_week: 1.0,
  is_weekend: 0,
  month: 12,
  day_of_year: 365,
  square_feet: 428647.0,
  air_temperature: 5.0,
  dew_temperature: 0.0,
  wind_speed: 4.0,
  lag_1h: 17999.0,
  lag_24h: 17999.0,
  rolling_mean_24h: 17999.0
};
const res4 = predictEnergyConsumption(case4);
console.log("\n4. EXTREME LAG CASE (Building 993):");
console.log(`   Python Reference: 131517.53 kWh (Log: 11.786903)`);
console.log(`   Node.js Output:   ${res4.predictedKwh} kWh (Log: ${res4.predictedLog})`);
console.log(`   Abs Difference:   ${Math.abs(res4.predictedKwh - 131517.53).toFixed(6)} kWh`);

const pass1 = Math.abs(res1.predictedKwh - 256.6234) <= 0.01;
const pass2 = Math.abs(res2.predictedKwh - 124.5006) <= 0.01;
const pass3 = Math.abs(res3.predictedKwh - 69549.3056) <= 0.01;
const pass4 = Math.abs(res4.predictedKwh - 131517.53) <= 0.01;

console.log("\n==================================================");
console.log(`VALIDATION RESULT: ${pass1 && pass2 && pass3 && pass4 ? "🟢 ALL 4 TEST CASES MATCH PYTHON PREDICTIONS PERFECTLY!" : "🔴 FAILED"}`);
console.log("==================================================");
