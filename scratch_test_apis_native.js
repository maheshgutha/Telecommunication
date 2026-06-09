const http = require('http');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Status ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  try {
    console.log('Logging in...');
    const loginRes = await post('http://localhost:5000/api/auth/login', {
      email: 'admin@aotms.com',
      password: 'admin123'
    });
    const token = loginRes.token;
    console.log('Login successful. Token acquired.');

    const endpoints = [
      { name: 'leads/stats', url: 'http://localhost:5000/api/leads/stats' },
      { name: 'followups?date=today', url: 'http://localhost:5000/api/followups?date=today' },
      { name: 'leads/my-calls', url: 'http://localhost:5000/api/leads/my-calls' },
      { name: 'reports/admin-analysis', url: 'http://localhost:5000/api/reports/admin-analysis' },
      { name: 'users', url: 'http://localhost:5000/api/users' }
    ];

    for (const ep of endpoints) {
      console.log(`\nTesting ${ep.name}...`);
      const start = Date.now();
      try {
        const res = await get(ep.url, token);
        console.log(`Status: ${res.status}, Time: ${Date.now() - start}ms`);
        if (res.status >= 200 && res.status < 300) {
          console.log('Result length:', res.body.length);
        } else {
          console.error('Error response:', res.body);
        }
      } catch (err) {
        console.error('Request failed:', err.message);
      }
    }
  } catch (err) {
    console.error('Fatal error:', err.message);
  }
}

run();
