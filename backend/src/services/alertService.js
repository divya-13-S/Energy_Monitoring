/**
 * services/alertService.js — Alert Notification & Threshold Logic
 */

export const isPowerOverload = (powerKw, thresholdKw = 50) => {
  return powerKw > thresholdKw;
};

export const filterActiveAlerts = (alerts = []) => {
  return alerts.filter(a => a.status !== 'Resolved');
};
