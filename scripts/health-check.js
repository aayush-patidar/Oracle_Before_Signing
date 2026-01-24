#!/usr/bin/env node
/**
 * Health check for OBS services
 * Usage: node scripts/health-check.js
 */

const http = require('http');

const services = [
  { name: 'Frontend', url: 'http://localhost:3000/', timeout: 5000 },
  { name: 'Backend API', url: 'http://localhost:3001/health', timeout: 5000 },
  { name: 'RPC (Anvil)', url: 'http://127.0.0.1:8545', timeout: 5000 },
];

async function checkService(service) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ ...service, status: 'DOWN', message: 'Connection timeout' });
    }, service.timeout);

    const req = http.get(service.url, (res) => {
      clearTimeout(timeout);
      if (res.statusCode >= 200 && res.statusCode < 500) {
        resolve({ ...service, status: 'UP', code: res.statusCode });
      } else {
        resolve({ ...service, status: 'ERROR', code: res.statusCode });
      }
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ ...service, status: 'DOWN', message: err.message });
    });
  });
}

async function main() {
  console.log('\n📋 OBS Service Health Check\n');
  console.log('Checking services...\n');

  const results = await Promise.all(services.map(checkService));

  results.forEach((result) => {
    const icon = result.status === 'UP' ? '✅' : result.status === 'DOWN' ? '❌' : '⚠️';
    const status = result.status === 'UP' ? `UP (HTTP ${result.code})` : result.status;
    console.log(`${icon} ${result.name.padEnd(15)} ${status.padEnd(20)} ${result.url}`);
    if (result.message) {
      console.log(`   └─ ${result.message}`);
    }
  });

  const allUp = results.every((r) => r.status === 'UP');
  console.log(`\n${allUp ? '✅ All services running!' : '⚠️ Some services are down'}\n`);

  if (!allUp) {
    console.log('💡 To start services, run:');
    console.log('   npm run dev\n');
  }

  process.exit(allUp ? 0 : 1);
}

main();
