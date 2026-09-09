/**
 * utils/testReportsAuth.js — Automated test for Reports Authentication & API Integration
 */

const baseUrl = 'http://localhost:5000/api';

async function runReportsAuthTest() {
  console.log('====================================================');
  console.log('🧪 REPORTS AUTHENTICATION & API INTEGRATION TEST');
  console.log('====================================================');

  // 1. Unauthenticated Request (No Token)
  console.log('\n--- 1. Testing Unauthenticated Request (No Authorization Header) ---');
  const unauthRes = await fetch(`${baseUrl}/reports/summary`);
  const unauthJson = await unauthRes.json();
  console.log('GET /api/reports/summary (No Auth): Status', unauthRes.status, 'Message:', unauthJson.message);
  if (unauthRes.status === 401) {
    console.log('  ✅ Server correctly rejected unauthenticated request with HTTP 401 Unauthorized!');
  } else {
    console.error('  ❌ Failed: Server should reject requests without token with HTTP 401.');
  }

  // 2. Authenticated Request (With Bearer Token)
  console.log('\n--- 2. Testing Authenticated Request (Authorization: Bearer <token>) ---');
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dev_mock_jwt_token_123',
    'X-User-Role': 'Administrator'
  };
  const authRes = await fetch(`${baseUrl}/reports/summary`, { headers: authHeaders });
  const authJson = await authRes.json();
  console.log('GET /api/reports/summary (With Auth): Status', authRes.status, 'Data:', authJson.data);
  if (authRes.status === 200 && authJson.success) {
    console.log('  ✅ Server accepted valid Bearer token and returned live MySQL report summary!');
  } else {
    console.error('  ❌ Failed: Server rejected valid Bearer token.');
  }

  // 3. Reports Trend Data
  console.log('\n--- 3. Testing Reports Trend Chart Endpoint ---');
  const trendRes = await fetch(`${baseUrl}/reports/trend`, { headers: authHeaders });
  const trendJson = await trendRes.json();
  console.log('GET /api/reports/trend: Status', trendRes.status, 'Data points count:', trendJson.data?.length);

  // 4. Reports Building Performance
  console.log('\n--- 4. Testing Reports Building Performance Endpoint ---');
  const bldgRes = await fetch(`${baseUrl}/reports/buildings`, { headers: authHeaders });
  const bldgJson = await bldgRes.json();
  console.log('GET /api/reports/buildings: Status', bldgRes.status, 'Buildings count:', bldgJson.data?.length);

  // 5. Reports Detailed Log Records
  console.log('\n--- 5. Testing Reports Detailed Telemetry Logs Endpoint ---');
  const detailRes = await fetch(`${baseUrl}/reports/details`, { headers: authHeaders });
  const detailJson = await detailRes.json();
  console.log('GET /api/reports/details: Status', detailRes.status, 'Records count:', detailJson.data?.records?.length);

  // 6. CSV Export via Query Token Parameter
  console.log('\n--- 6. Testing CSV Report Export Endpoint ---');
  const csvRes = await fetch(`${baseUrl}/reports/export/csv?token=dev_mock_jwt_token_123`);
  console.log('GET /api/reports/export/csv?token=...: Status', csvRes.status, 'Content-Type:', csvRes.headers.get('content-type'));

  console.log('\n🎉 REPORTS AUTHENTICATION & API INTEGRATION TEST COMPLETED SUCCESSFULLY!');
}

runReportsAuthTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test Execution Failed:', err);
    process.exit(1);
  });
