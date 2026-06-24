const http = require('http');
const path = require('path');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '127.0.0.1';

async function waitForServer(maxRetries = 5, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://${HOST}:${PORT}/api/health`, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(3000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      return;
    } catch {
      console.log(`Waiting for server on ${HOST}:${PORT}... (attempt ${i + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error(`Server not reachable at ${HOST}:${PORT} after ${maxRetries} retries`);
}

async function testEndpoint(name, method, urlPath, body) {
  try {
    const result = await new Promise((resolve, reject) => {
      const opts = { hostname: HOST, port: PORT, path: urlPath, method, headers: {} };
      if (body) opts.headers['Content-Type'] = 'application/json';
      const req = http.request(opts, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', e => reject(e));
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
    const isEmpty = !result.body || result.body.trim() === '';
    const preview = result.body ? result.body.substring(0, 300) : '';
    console.log(`[${result.status}] ${name} | empty=${isEmpty} | len=${preview.length} | ${preview}`);
  } catch (e) {
    console.log(`[ERR] ${name} | ${e.message}`);
  }
}

async function main() {
  console.log(`\nNetMonitor API Test Suite`);
  console.log(`Target: http://${HOST}:${PORT}`);
  console.log('='.repeat(60));

  await waitForServer();
  console.log('Server is ready. Running tests...\n');

  const endpoints = [
    { name: 'health', method: 'GET', path: '/api/health' },
    { name: 'ip/lookup', method: 'GET', path: '/api/ip/lookup' },
    { name: 'tls/check', method: 'GET', path: '/api/tls/check?host=example.com' },
    { name: 'headers/check', method: 'GET', path: '/api/headers/check?url=https://example.com' },
    { name: 'ech/check', method: 'GET', path: '/api/ech/check?host=example.com' },
    { name: 'speedtest/latency', method: 'GET', path: '/api/speedtest/latency' },
    { name: 'speedtest/download', method: 'GET', path: '/api/speedtest/download?sizeMB=1' },
    { name: 'history GET', method: 'GET', path: '/api/history' },
    { name: 'history POST', method: 'POST', path: '/api/history', body: { tool: 'test', target: 'test', result: { ok: true } } },
  ];

  for (const ep of endpoints) {
    await testEndpoint(ep.name, ep.method, ep.path, ep.body);
  }

  console.log('\n' + '='.repeat(60));
  console.log('All tests completed.');
  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
