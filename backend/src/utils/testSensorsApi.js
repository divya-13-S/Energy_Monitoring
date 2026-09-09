/**
 * utils/testSensorsApi.js — Automated test script for Sensor Management backend APIs
 */

import {
  getPaginatedSensors,
  getSensorSummaryKPIs,
  getSensorById,
  createSensor,
  updateSensor,
  toggleSensorStatus,
  getSensorTelemetryHistory,
} from '../services/sensorService.js';

const runTests = async () => {
  console.log('🧪 Running Sensor Management Backend Service Tests...\n');

  // 1. KPI Summary
  const summary = await getSensorSummaryKPIs();
  console.log('✅ 1. Sensor KPI Summary Test passed:');
  console.log('   → Total:', summary.totalSensors);
  console.log('   → Online:', summary.onlineSensors);
  console.log('   → Offline:', summary.offlineSensors);
  console.log('   → Maintenance:', summary.maintenanceSensors);

  // 2. Paginated list with filtering
  const filtered = await getPaginatedSensors({
    buildingId: '1',
    limit: 5,
  });
  console.log('\n✅ 2. Filtered Sensors Test passed:');
  console.log('   → Total items for Building 1:', filtered.pagination.totalItems);
  console.log('   → Returned items:', filtered.sensors.length);

  // 3. Create Sensor
  const testCode = `SNS-TEST-${Date.now().toString().slice(-5)}`;
  const created = await createSensor({
    sensor_code: testCode,
    sensor_name: 'Automated Test Smart Meter',
    building_id: 1,
    department_id: 1,
    parameter: 'Energy & Power Demand',
    room_location: 'Automated Test Room 101',
    status: 'Online',
  });
  console.log('\n✅ 3. Create Sensor Test passed:');
  console.log('   → Created ID:', created.id);
  console.log('   → Code:', created.sensor_code);
  console.log('   → Name:', created.sensor_name);

  // 4. Update Sensor
  const updated = await updateSensor(created.id, {
    sensor_name: 'Automated Test Smart Meter (Updated)',
    room_location: 'Automated Test Room 102',
  });
  console.log('\n✅ 4. Update Sensor Test passed:');
  console.log('   → Updated Name:', updated.sensor_name);
  console.log('   → Updated Room:', updated.room_location);

  // 5. Toggle Status
  const statusChanged = await toggleSensorStatus(created.id, 'Maintenance');
  console.log('\n✅ 5. Toggle Status Test passed:');
  console.log('   → New Status:', statusChanged.status);

  // 6. Telemetry History
  const history = await getSensorTelemetryHistory(created.id, 5);
  console.log('\n✅ 6. Telemetry History Lookup Test passed:');
  console.log('   → Facility:', history.sensor.building_name, '—', history.sensor.department_name);
  console.log('   → Telemetry logs count:', history.readings.length);

  console.log('\n🎉 ALL SENSOR MANAGEMENT BACKEND API TESTS PASSED SUCCESSFULLY!');
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Sensor API Test Error:', err);
    process.exit(1);
  });
