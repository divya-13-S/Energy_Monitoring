/**
 * Development Energy Readings Dataset
 * Telemetry readings generated across the 8 campus buildings.
 */

const getRelativeDateString = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

export const TODAY_DATE = getRelativeDateString(0);
export const YESTERDAY_DATE = getRelativeDateString(-1);

const buildings = [
  { id: 'bldg_ib', name: 'IB Block', baseKw: 18.5 },
  { id: 'bldg_as', name: 'AS Block', baseKw: 22.0 },
  { id: 'bldg_mech', name: 'Mechanical Block', baseKw: 14.0 },
  { id: 'bldg_sunflower', name: 'Sunflower Block', baseKw: 25.5 },
  { id: 'bldg_research', name: 'Research Park', baseKw: 11.0 },
  { id: 'bldg_lib', name: 'Library', baseKw: 8.5 },
  { id: 'bldg_gh', name: 'Girls Hostel', baseKw: 16.0 },
  { id: 'bldg_bh', name: 'Boys Hostel', baseKw: 17.5 },
];

// Usage multipliers across 24 hours
const hourlyProfile = [
  0.20, 0.18, 0.15, 0.15, 0.18, 0.25, 0.45, 0.65, // 00:00 - 07:00
  0.90, 1.30, 1.50, 1.55, 1.40, 1.45, 1.60, 1.50, // 08:00 - 15:00
  1.25, 0.95, 0.70, 0.50, 0.40, 0.35, 0.28, 0.22  // 16:00 - 23:00
];

const generateReadingsForDate = (dateStr, isYesterday = false) => {
  const readings = [];
  const dateFactor = isYesterday ? 0.95 : 1.0;

  buildings.forEach((bldg) => {
    hourlyProfile.forEach((multiplier, hour) => {
      const timePad = String(hour).padStart(2, '0');
      const timestamp = `${dateStr}T${timePad}:00:00`;
      
      const calculatedPower = parseFloat((bldg.baseKw * multiplier * dateFactor).toFixed(2));
      const energyKwh = parseFloat((calculatedPower * 1.0).toFixed(2));
      
      const voltage = parseFloat((228 + (Math.sin(hour) * 4)).toFixed(1));
      const current = parseFloat((calculatedPower * 1000 / (voltage * 0.92)).toFixed(1));
      const frequency = parseFloat((49.9 + (Math.cos(hour) * 0.15)).toFixed(2));
      const powerFactor = parseFloat((0.90 + (Math.sin(hour) * 0.04)).toFixed(2));

      readings.push({
        id: `rdg_${isYesterday ? 'y' : 't'}_${bldg.id}_${timePad}`,
        timestamp,
        date: dateStr,
        buildingId: bldg.id,
        buildingName: bldg.name,
        voltage,
        current,
        power: calculatedPower,
        energyConsumption: energyKwh,
        frequency,
        powerFactor,
      });
    });
  });

  return readings;
};

export const sampleEnergyReadings = [
  ...generateReadingsForDate(YESTERDAY_DATE, true),
  ...generateReadingsForDate(TODAY_DATE, false),
];

export default sampleEnergyReadings;
