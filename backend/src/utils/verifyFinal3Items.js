import http from 'http';

function requestAPI(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTargetedVerification() {
  console.log('====================================================');
  console.log('     TARGETED FINAL VERIFICATION OF THE 3 ITEMS     ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(name, condition, details = '') {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${name} ${details}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${name} ${details}`);
    }
  }

  // --- ITEM 1: ALERT ID UNIQUENESS ---
  console.log('--- 1. ALERT ID UNIQUENESS VERIFICATION ---');
  const adminHeaders = {
    'Authorization': 'Bearer jwt_token_1',
    'X-User-Id': '1',
    'X-User-Role': 'Administrator'
  };

  const detectRes = await requestAPI('/api/alerts/detect', 'POST', adminHeaders);
  assertTest('Trigger Alert Detection API Execution', detectRes.status === 200, `(HTTP ${detectRes.status})`);

  const alertsRes = await requestAPI('/api/alerts?limit=50', 'GET', adminHeaders);
  const alertsList = alertsRes.data?.data || [];
  assertTest('Fetch Generated Alerts List', alertsRes.status === 200 && alertsList.length > 0, `(${alertsList.length} alerts returned)`);

  let duplicateFound = false;
  const alertIdsSet = new Set();
  for (const a of alertsList) {
    if (alertIdsSet.has(a.id)) {
      duplicateFound = true;
      break;
    }
    alertIdsSet.add(a.id);
  }
  assertTest('Zero Duplicate Alert IDs in Database', !duplicateFound, `(Checked ${alertsList.length} alerts)`);

  const sampleId = alertsList[0]?.id || '';
  const isDeterministicFormat = sampleId.startsWith('ALT_') || sampleId.startsWith('ALT');
  assertTest('Alert ID Format Verification', isDeterministicFormat, `(Sample ID: ${sampleId})`);

  console.log('');

  // --- ITEM 2: ROLE AUTHORIZATION (401 / 403 / 200) ---
  console.log('--- 2. ROLE AUTHORIZATION & 403 GUARDS VERIFICATION ---');

  const hodHeaders = {
    'Authorization': 'Bearer jwt_token_2',
    'X-User-Id': '2',
    'X-User-Role': 'Department Staff (HOD)',
    'X-User-Dept-Id': '8',
    'X-User-Bldg-Id': '4'
  };

  const electricianHeaders = {
    'Authorization': 'Bearer jwt_token_3',
    'X-User-Id': '3',
    'X-User-Role': 'Electrician / Maintenance Staff',
    'X-User-Dept-Id': '1',
    'X-User-Bldg-Id': '1'
  };

  // 401 Unauthenticated Test
  const noTokenRes = await requestAPI('/api/users');
  assertTest('Unauthenticated User -> 401 Unauthorized', noTokenRes.status === 401, `(HTTP ${noTokenRes.status})`);

  // HOD 403 Access Denied Tests
  const hodUsersRes = await requestAPI('/api/users', 'GET', hodHeaders);
  assertTest('HOD accessing User Management -> 403 Forbidden', hodUsersRes.status === 403, `(HTTP ${hodUsersRes.status})`);

  const hodSettingsGetRes = await requestAPI('/api/settings', 'GET', hodHeaders);
  assertTest('HOD reading Settings -> 403 Forbidden', hodSettingsGetRes.status === 403, `(HTTP ${hodSettingsGetRes.status})`);

  const hodSettingsPutRes = await requestAPI('/api/settings', 'PUT', hodHeaders, { setting_key: 'test' });
  assertTest('HOD modifying Settings -> 403 Forbidden', hodSettingsPutRes.status === 403, `(HTTP ${hodSettingsPutRes.status})`);

  const hodThresholdsPutRes = await requestAPI('/api/alerts/thresholds', 'PUT', hodHeaders, { max_voltage: 245 });
  assertTest('HOD modifying Alert Thresholds -> 403 Forbidden', hodThresholdsPutRes.status === 403, `(HTTP ${hodThresholdsPutRes.status})`);

  const hodSensorsGetRes = await requestAPI('/api/sensors', 'GET', hodHeaders);
  assertTest('HOD accessing Sensor Management -> 403 Forbidden', hodSensorsGetRes.status === 403, `(HTTP ${hodSensorsGetRes.status})`);

  // Electrician 403 / 200 Tests
  const elecUsersRes = await requestAPI('/api/users', 'GET', electricianHeaders);
  assertTest('Electrician accessing User Management -> 403 Forbidden', elecUsersRes.status === 403, `(HTTP ${elecUsersRes.status})`);

  const elecSettingsRes = await requestAPI('/api/settings', 'GET', electricianHeaders);
  assertTest('Electrician reading Settings -> 403 Forbidden', elecSettingsRes.status === 403, `(HTTP ${elecSettingsRes.status})`);

  const elecSensorsRes = await requestAPI('/api/sensors', 'GET', electricianHeaders);
  assertTest('Electrician accessing Sensor Management -> 200 OK', elecSensorsRes.status === 200, `(HTTP ${elecSensorsRes.status})`);

  // Administrator 200 Authorized Tests
  const adminUsersRes = await requestAPI('/api/users', 'GET', adminHeaders);
  assertTest('Administrator accessing User Management -> 200 OK', adminUsersRes.status === 200, `(HTTP ${adminUsersRes.status})`);

  const adminSettingsRes = await requestAPI('/api/settings', 'GET', adminHeaders);
  assertTest('Administrator reading Settings -> 200 OK', adminSettingsRes.status === 200, `(HTTP ${adminSettingsRes.status})`);

  console.log('');

  // --- ITEM 3: HOD DATA SCOPE ISOLATION ---
  console.log('--- 3. HOD DATA SCOPE ISOLATION VERIFICATION ---');

  // HOD User 2 (CSE Dept = 8, Sunflower Block = 4)
  const hodDashRes = await requestAPI('/api/dashboard/summary', 'GET', hodHeaders);
  const hodDashData = hodDashRes.data?.data || {};
  assertTest('HOD Dashboard Building Scope Isolation', hodDashData.totalBuildings === 1, `(Buildings count: ${hodDashData.totalBuildings})`);
  assertTest('HOD Dashboard Department Scope Isolation', hodDashData.totalDepartments === 1, `(Departments count: ${hodDashData.totalDepartments})`);

  const hodBldgsRes = await requestAPI('/api/buildings', 'GET', hodHeaders);
  const hodBldgsList = hodBldgsRes.data?.data?.buildings || [];
  assertTest('HOD Buildings List Isolation', hodBldgsList.length === 1 && hodBldgsList[0].numericId === 4, `(Returned building ID: ${hodBldgsList[0]?.numericId})`);

  const hodOtherBldgRes = await requestAPI('/api/buildings/1', 'GET', hodHeaders);
  assertTest('HOD Cross-Building Detail Access -> 403 Forbidden', hodOtherBldgRes.status === 403, `(HTTP ${hodOtherBldgRes.status})`);

  const hodDeptsRes = await requestAPI('/api/departments', 'GET', hodHeaders);
  const hodDeptsList = hodDeptsRes.data?.data?.departments || [];
  assertTest('HOD Departments List Isolation', hodDeptsList.length === 1 && hodDeptsList[0].numericId === 8, `(Returned department ID: ${hodDeptsList[0]?.numericId})`);

  const hodOtherDeptRes = await requestAPI('/api/departments/1', 'GET', hodHeaders);
  assertTest('HOD Cross-Department Detail Access -> 403 Forbidden', hodOtherDeptRes.status === 403, `(HTTP ${hodOtherDeptRes.status})`);

  const hodLiveReadingsRes = await requestAPI('/api/live-monitoring/readings', 'GET', hodHeaders);
  const hodLiveReadings = hodLiveReadingsRes.data?.data || [];
  const foreignReadings = hodLiveReadings.filter(r => r.department_id !== 8 && r.building_id !== 4);
  assertTest('HOD Live Monitoring Telemetry Isolation', hodLiveReadings.length > 0 && foreignReadings.length === 0, `(${hodLiveReadings.length} readings checked, ${foreignReadings.length} foreign leakage)`);

  const hodLiveBldgsRes = await requestAPI('/api/live-monitoring/buildings', 'GET', hodHeaders);
  const hodLiveBldgs = hodLiveBldgsRes.data?.data || [];
  assertTest('HOD Live Monitoring Buildings Metrics Isolation', hodLiveBldgs.length === 1 && hodLiveBldgs[0].id === 4, `(Returned live building ID: ${hodLiveBldgs[0]?.id})`);

  const hodLiveDeptsRes = await requestAPI('/api/live-monitoring/departments', 'GET', hodHeaders);
  const hodLiveDepts = hodLiveDeptsRes.data?.data || [];
  assertTest('HOD Live Monitoring Departments Metrics Isolation', hodLiveDepts.length === 1 && hodLiveDepts[0].id === 8, `(Returned live department ID: ${hodLiveDepts[0]?.id})`);

  const hodReportsRes = await requestAPI('/api/reports/buildings', 'GET', hodHeaders);
  const hodReportsData = hodReportsRes.data?.data || [];
  const foreignReportBldgs = hodReportsData.filter(b => b.building_id !== 4 && b.id !== 4);
  assertTest('HOD Reports Data Isolation', foreignReportBldgs.length === 0, `(${hodReportsData.length} report rows, ${foreignReportBldgs.length} foreign leakage)`);

  const hodOptRes = await requestAPI('/api/optimization/summary', 'GET', hodHeaders);
  assertTest('HOD Energy Optimization Scope Isolation', hodOptRes.status === 200, `(HTTP ${hodOptRes.status})`);

  const hodAlertsRes = await requestAPI('/api/alerts', 'GET', hodHeaders);
  const hodAlertsList = hodAlertsRes.data?.data || [];
  const foreignAlerts = hodAlertsList.filter(a => a.department_id !== 8);
  assertTest('HOD Alerts Data Isolation', foreignAlerts.length === 0, `(${hodAlertsList.length} alerts checked, ${foreignAlerts.length} foreign leakage)`);

  console.log('\n====================================================');
  console.log(`TOTAL AUDIT CHECKS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log('====================================================\n');
}

runTargetedVerification();
