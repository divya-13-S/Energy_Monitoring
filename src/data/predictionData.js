/**
 * Sample AI Prediction Dataset (Temporary / Development)
 * This dataset simulates output from Python Scikit-Learn prediction models (Linear Regression & Random Forest).
 * Note: Marked clearly as development forecast mock data.
 */

// Tomorrow's date helper
const getTomorrowDateString = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

export const TOMORROW_DATE = getTomorrowDateString();

export const samplePredictionData = {
  forecastDate: TOMORROW_DATE,
  predictedTotalKwh: 1845.5,
  modelUsed: 'Random Forest Regressor (v1.2)',
  confidenceScore: 0.94,
  isForecastSample: true,
  departmentPredictions: [
    { departmentId: 'dept_ece', predictedKwh: 410.2 },
    { departmentId: 'dept_cse', predictedKwh: 495.8 },
    { departmentId: 'dept_eee', predictedKwh: 310.0 },
    { departmentId: 'dept_mech', predictedKwh: 260.5 },
    { departmentId: 'dept_civil', predictedKwh: 145.0 },
    { departmentId: 'dept_lib', predictedKwh: 134.0 },
    { departmentId: 'dept_admin', predictedKwh: 90.0 },
  ],
};

export default samplePredictionData;
