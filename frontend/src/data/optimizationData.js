/**
 * Sample Optimization Recommendations Dataset (Development Phase)
 * Contains energy efficiency suggestions, detected inefficiencies, and potential kWh savings.
 */

export const sampleOptimizationData = [
  {
    id: 'opt_001',
    department: 'CSE Department',
    building: 'CSE Block',
    issue: 'Computer Lab 3 HVAC units running at full load after working hours',
    estimatedSavingKwh: 120.5,
    priority: 'High',
  },
  {
    id: 'opt_002',
    department: 'ECE Department',
    building: 'ECE Block',
    issue: 'Corridor and staircase lighting operational during daytime daylight hours',
    estimatedSavingKwh: 45.0,
    priority: 'Medium',
  },
  {
    id: 'opt_003',
    department: 'Central Library',
    building: 'Library Complex',
    issue: 'Chillers running at sub-optimal temperature coefficient',
    estimatedSavingKwh: 85.2,
    priority: 'High',
  },
  {
    id: 'opt_004',
    department: 'Mechanical Dept',
    building: 'Mechanical Workshop',
    issue: 'Unused heavy CNC machines left in standby power mode',
    estimatedSavingKwh: 62.8,
    priority: 'Medium',
  },
  {
    id: 'opt_005',
    department: 'Administration',
    building: 'Admin Main Building',
    issue: 'Old halogen lamps in auditorium pending LED conversion',
    estimatedSavingKwh: 38.0,
    priority: 'Low',
  },
];

export default sampleOptimizationData;
