import http from 'http';

function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: headers,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function testAuthEnforcement() {
  console.log('--- TESTING AUTHENTICATION ENFORCEMENT (NO TOKEN) ---');
  const guardedEndpoints = [
    '/api/dashboard/summary',
    '/api/buildings',
    '/api/departments',
    '/api/live-monitoring/summary',
    '/api/optimization/summary',
    '/api/reports/summary',
    '/api/alerts',
    '/api/users',
    '/api/sensors',
    '/api/settings',
    '/api/profile',
  ];

  for (const ep of guardedEndpoints) {
    const res = await makeRequest(ep);
    if (res.status === 401) {
      console.log(`[PASS 401 Guard] ${ep} correctly rejected unauthorized request.`);
    } else {
      console.error(`[FAIL Auth Guard] ${ep} returned HTTP ${res.status} when token was omitted.`);
    }
  }
}

testAuthEnforcement();
