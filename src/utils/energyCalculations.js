/**
 * Energy Monitoring & KPI Calculation Utilities
 * Pure functions for aggregating telemetry readings, financial costs, forecasts, and status counts.
 */

import { ELECTRICITY_TARIFF, CURRENCY_SYMBOL } from '../data/config';
import { sampleEnergyReadings, TODAY_DATE, YESTERDAY_DATE } from '../data/energyReadings';
import { samplePredictionData } from '../data/predictionData';
import { sampleOptimizationData } from '../data/optimizationData';
import { sampleAlertsData } from '../data/alertsData';
import { sampleBuildingsData } from '../data/buildingsData';
import { sampleDepartmentsData } from '../data/departmentsData';

/**
 * Calculates total energy consumption in kWh for a given date string.
 */
export const calculateTotalEnergyByDate = (readings, dateStr) => {
  if (!Array.isArray(readings)) return 0;
  const filtered = readings.filter((r) => r.date === dateStr);
  const total = filtered.reduce((sum, r) => sum + (Number(r.energyConsumption) || 0), 0);
  return parseFloat(total.toFixed(2));
};

/**
 * Calculates Today's Energy KPI metrics and comparison vs Yesterday.
 */
export const getTodayEnergyKpi = (readings = sampleEnergyReadings) => {
  const todayKwh = calculateTotalEnergyByDate(readings, TODAY_DATE);
  const yesterdayKwh = calculateTotalEnergyByDate(readings, YESTERDAY_DATE);

  let percentChange = 0;
  if (yesterdayKwh > 0) {
    percentChange = parseFloat((((todayKwh - yesterdayKwh) / yesterdayKwh) * 100).toFixed(1));
  }

  const isIncrease = percentChange > 0;
  const trendDirection = isIncrease ? 'up' : percentChange < 0 ? 'down' : 'neutral';
  const variant = isIncrease ? 'warning' : 'success';
  const formattedChange = `${isIncrease ? '+' : ''}${percentChange}%`;

  return {
    title: "Today's Energy Consumption",
    value: todayKwh.toLocaleString('en-IN'),
    numericValue: todayKwh,
    unit: 'kWh',
    trend: formattedChange,
    trendDirection,
    variant,
    supportingText: `vs ${yesterdayKwh.toLocaleString('en-IN')} kWh yesterday`,
  };
};

/**
 * Calculates Today's Estimated Cost KPI metrics.
 */
export const getTodayCostKpi = (readings = sampleEnergyReadings, tariff = ELECTRICITY_TARIFF) => {
  const todayKwh = calculateTotalEnergyByDate(readings, TODAY_DATE);
  const yesterdayKwh = calculateTotalEnergyByDate(readings, YESTERDAY_DATE);

  const todayCost = Math.round(todayKwh * tariff);
  const yesterdayCost = Math.round(yesterdayKwh * tariff);

  let percentChange = 0;
  if (yesterdayCost > 0) {
    percentChange = parseFloat((((todayCost - yesterdayCost) / yesterdayCost) * 100).toFixed(1));
  }

  const isIncrease = percentChange > 0;
  const trendDirection = isIncrease ? 'up' : percentChange < 0 ? 'down' : 'neutral';
  const variant = 'primary';
  const formattedChange = `${isIncrease ? '+' : ''}${percentChange}%`;

  return {
    title: 'Estimated Cost Today',
    value: `${CURRENCY_SYMBOL}${todayCost.toLocaleString('en-IN')}`,
    numericValue: todayCost,
    unit: '',
    trend: formattedChange,
    trendDirection,
    variant,
    supportingText: `Tariff @ ${CURRENCY_SYMBOL}${tariff}/kWh (${CURRENCY_SYMBOL}${yesterdayCost.toLocaleString('en-IN')} yesterday)`,
  };
};

/**
 * Gets AI Prediction KPI metrics for tomorrow.
 */
export const getPredictionKpi = (prediction = samplePredictionData) => {
  const predictedValue = prediction.predictedTotalKwh || 0;
  const confidencePercent = Math.round((prediction.confidenceScore || 0.9) * 100);

  return {
    title: "Tomorrow's Prediction",
    value: predictedValue.toLocaleString('en-IN'),
    numericValue: predictedValue,
    unit: 'kWh',
    badge: 'AI Forecast',
    variant: 'primary',
    supportingText: `Model: ${prediction.modelUsed || 'Random Forest'} (${confidencePercent}% conf)`,
  };
};

/**
 * Calculates Potential Energy Savings KPI metrics.
 */
export const getPotentialSavingKpi = (
  optimizations = sampleOptimizationData,
  readings = sampleEnergyReadings
) => {
  const totalSavingKwh = optimizations.reduce(
    (sum, item) => sum + (Number(item.estimatedSavingKwh) || 0),
    0
  );
  const todayKwh = calculateTotalEnergyByDate(readings, TODAY_DATE) || 1;

  const savingPercentage = parseFloat(((totalSavingKwh / todayKwh) * 100).toFixed(1));

  return {
    title: 'Potential Energy Saving',
    value: `${savingPercentage}%`,
    numericValue: savingPercentage,
    unit: '',
    variant: 'success',
    supportingText: `${totalSavingKwh.toFixed(1)} kWh potential reduction identified`,
  };
};

/**
 * Calculates Active Alerts KPI metrics.
 */
export const getActiveAlertsKpi = (alerts = sampleAlertsData) => {
  const activeAlerts = alerts.filter((a) => a.status !== 'Resolved');
  const totalActive = activeAlerts.length;

  const criticalCount = activeAlerts.filter((a) => a.severity === 'Critical').length;
  const highCount = activeAlerts.filter((a) => a.severity === 'High').length;
  const mediumCount = activeAlerts.filter((a) => a.severity === 'Medium').length;

  const variant = criticalCount > 0 ? 'danger' : totalActive > 0 ? 'warning' : 'success';

  return {
    title: 'Active Alerts',
    value: totalActive.toString(),
    numericValue: totalActive,
    unit: '',
    variant,
    supportingText: `${criticalCount} Critical, ${highCount} High, ${mediumCount} Medium`,
  };
};

/**
 * Calculates Connected Buildings KPI metrics.
 */
export const getConnectedBuildingsKpi = (buildings = sampleBuildingsData) => {
  const totalBuildings = buildings.length;
  const connectedCount = buildings.filter(
    (b) => b.status === 'Connected' || b.status === 'Attention Required'
  ).length;
  const attentionCount = buildings.filter((b) => b.status === 'Attention Required').length;

  const variant = attentionCount > 0 ? 'warning' : 'success';

  return {
    title: 'Connected Buildings',
    value: `${connectedCount} / ${totalBuildings}`,
    numericValue: connectedCount,
    unit: 'Online',
    variant,
    supportingText: attentionCount > 0 ? `${attentionCount} building needs attention` : 'All buildings online',
  };
};

/**
 * Calculates per-building energy consumption, power demand, monthly usage, and alerts count.
 */
export const getBuildingsEnergySummary = (
  buildings = sampleBuildingsData,
  readings = sampleEnergyReadings,
  alerts = sampleAlertsData,
  tariff = ELECTRICITY_TARIFF
) => {
  const todayReadings = readings.filter((r) => r.date === TODAY_DATE);
  const totalCampusKwh = todayReadings.reduce((sum, r) => sum + (Number(r.energyConsumption) || 0), 0) || 1;

  const buildingSummaries = buildings.map((bldg) => {
    const bldgReadings = todayReadings.filter((r) => r.buildingId === bldg.id);
    const todayKwh = parseFloat(
      bldgReadings.reduce((sum, r) => sum + (Number(r.energyConsumption) || 0), 0).toFixed(1)
    );

    // Calculate monthly consumption dynamically based on daily profile projection
    const monthlyKwh = Math.round(todayKwh * 30.4);

    const latestReading = bldgReadings[bldgReadings.length - 1];
    const currentPowerKw = latestReading ? latestReading.power : 0;
    const estCost = Math.round(todayKwh * tariff);

    // Count unresolved active alerts for this building
    const buildingAlerts = alerts.filter(
      (a) => a.buildingId === bldg.id && a.status !== 'Resolved'
    );
    const activeAlertsCount = buildingAlerts.length;

    // Overall Building Status Classification
    let consumptionLevel = 'okay'; // 'high' | 'moderate' | 'okay'
    let levelLabel = 'Normal';

    if (todayKwh >= 380 || activeAlertsCount > 1) {
      consumptionLevel = 'high';
      levelLabel = 'High Load';
    } else if (todayKwh >= 250 || activeAlertsCount === 1) {
      consumptionLevel = 'moderate';
      levelLabel = 'Moderate';
    }

    return {
      ...bldg,
      unitsText: (bldg.units || []).join(' • '),
      todayKwh,
      monthlyKwh,
      currentPowerKw,
      estCost,
      activeAlertsCount,
      consumptionLevel,
      levelLabel,
    };
  });

  buildingSummaries.sort((a, b) => b.todayKwh - a.todayKwh);

  const highCount = buildingSummaries.filter((b) => b.consumptionLevel === 'high').length;
  const moderateCount = buildingSummaries.filter((b) => b.consumptionLevel === 'moderate').length;
  const okayCount = buildingSummaries.filter((b) => b.consumptionLevel === 'okay').length;

  return {
    buildings: buildingSummaries,
    totalCampusKwh: parseFloat(totalCampusKwh.toFixed(1)),
    totalBuildings: buildings.length,
    highCount,
    moderateCount,
    okayCount,
  };
};

/**
 * Calculates per-department energy consumption, monthly usage, power demand, saving potential, and groups by building.
 */
export const getDepartmentsEnergySummary = (
  departments = sampleDepartmentsData,
  buildings = sampleBuildingsData,
  tariff = ELECTRICITY_TARIFF
) => {
  // Generate dynamic telemetry metrics for each department/unit
  const departmentSummaries = departments.map((dept) => {
    // Dynamic daily kWh based on baseKw capacity
    const todayKwh = parseFloat((dept.baseKw * 18.4).toFixed(1));
    const monthlyKwh = Math.round(todayKwh * 30.4);
    const estCost = Math.round(todayKwh * tariff);
    const currentPowerKw = parseFloat((dept.baseKw * 1.35).toFixed(1));

    let consumptionLevel = 'okay'; // 'high' | 'moderate' | 'okay'
    let levelLabel = 'Normal';

    if (todayKwh >= 200 || dept.activeAlertsCount > 0) {
      consumptionLevel = 'high';
      levelLabel = 'High Load';
    } else if (todayKwh >= 120) {
      consumptionLevel = 'moderate';
      levelLabel = 'Moderate';
    }

    return {
      ...dept,
      todayKwh,
      monthlyKwh,
      estCost,
      currentPowerKw,
      consumptionLevel,
      levelLabel,
    };
  });

  // Group departments under their respective building
  const groupedByBuilding = buildings.map((bldg) => {
    const bldgDepartments = departmentSummaries.filter((d) => d.buildingId === bldg.id);
    const bldgTodayKwh = parseFloat(
      bldgDepartments.reduce((sum, d) => sum + d.todayKwh, 0).toFixed(1)
    );

    return {
      buildingId: bldg.id,
      buildingName: bldg.name,
      buildingCode: bldg.code,
      unitsText: (bldg.units || []).join(' • '),
      departments: bldgDepartments,
      totalTodayKwh: bldgTodayKwh,
    };
  });

  const totalCampusKwh = parseFloat(
    departmentSummaries.reduce((sum, d) => sum + d.todayKwh, 0).toFixed(1)
  );

  const highCount = departmentSummaries.filter((d) => d.consumptionLevel === 'high').length;
  const moderateCount = departmentSummaries.filter((d) => d.consumptionLevel === 'moderate').length;
  const okayCount = departmentSummaries.filter((d) => d.consumptionLevel === 'okay').length;

  return {
    departments: departmentSummaries,
    groupedByBuilding,
    totalCampusKwh,
    totalDepartments: departments.length,
    highCount,
    moderateCount,
    okayCount,
  };
};

