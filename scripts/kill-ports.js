#!/usr/bin/env node
/**
 * Kill processes on common development ports
 * Usage: node scripts/kill-ports.js
 */

const os = require('os');
const { execSync } = require('child_process');

const ports = [3000, 3001, 8545];
const isWindows = os.platform() === 'win32';

console.log('🔍 Killing processes on ports:', ports.join(', '));

ports.forEach((port) => {
  try {
    if (isWindows) {
      // Windows
      execSync(`netstat -ano | findstr :${port} | for /f "tokens=5" %a in ('findstr :${port}') do taskkill /PID %a /F 2>nul`, {
        shell: 'cmd.exe',
        stdio: 'pipe',
      });
      console.log(`✓ Port ${port} cleared (Windows)`);
    } else {
      // Unix/Linux/macOS
      try {
        execSync(`lsof -ti :${port} | xargs kill -9 2>/dev/null`);
        console.log(`✓ Port ${port} cleared (Unix)`);
      } catch (e) {
        // Port may already be free
      }
    }
  } catch (err) {
    // Silently ignore if port not in use
  }
});

console.log('✅ Done! Ports are now available.\n');
