/**
 * Sample Energy & Electrical System Alerts Dataset
 */

export const sampleAlertsData = [
  {
    id: 'alt_101',
    timestamp: '2026-08-27T14:15:00',
    buildingId: 'bldg_sunflower',
    building: 'Sunflower Block',
    type: 'Overload Warning',
    severity: 'Critical',
    status: 'Active',
    message: 'CSE Computer Lab 2 draw exceeded safety threshold.',
  },
  {
    id: 'alt_102',
    timestamp: '2026-08-27T13:40:00',
    buildingId: 'bldg_bh',
    building: 'Boys Hostel',
    type: 'High Voltage Spike',
    severity: 'High',
    status: 'Active',
    message: 'Phase B voltage spike detected at Emerald block sub-panel.',
  },
  {
    id: 'alt_103',
    timestamp: '2026-08-27T12:10:00',
    buildingId: 'bldg_as',
    building: 'AS Block',
    type: 'Low Power Factor',
    severity: 'Medium',
    status: 'Active',
    message: 'Power factor drop logged in Textile Lab feeder line.',
  },
  {
    id: 'alt_104',
    timestamp: '2026-08-27T11:05:00',
    buildingId: 'bldg_sunflower',
    building: 'Sunflower Block',
    type: 'High Thermal Demand',
    severity: 'Medium',
    status: 'Active',
    message: 'IT Server Room HVAC unit working at maximum continuous load.',
  },
  {
    id: 'alt_105',
    timestamp: '2026-08-27T09:30:00',
    buildingId: 'bldg_gh',
    building: 'Girls Hostel',
    type: 'Baseline Spike',
    severity: 'Low',
    status: 'Acknowledged',
    message: 'Water pumping baseline logged between 04:00 AM and 05:30 AM.',
  },
  {
    id: 'alt_106',
    timestamp: '2026-08-26T18:20:00',
    buildingId: 'bldg_ib',
    building: 'IB Block',
    type: 'Minor Voltage Dip',
    severity: 'Low',
    status: 'Resolved',
    message: 'Voltage dip resolved by automatic voltage stabilizer.',
  },
];

export default sampleAlertsData;
