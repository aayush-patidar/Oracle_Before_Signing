#!/usr/bin/env node

/**
 * Deployment Diagnostic Tool
 * Run this to identify deployment issues
 */

const https = require('https');
const http = require('http');

// CONFIGURATION - UPDATE THESE WITH YOUR URLS
const VERCEL_URL = process.env.VERCEL_URL || 'https://your-app.vercel.app';
const RENDER_URL = process.env.RENDER_URL || 'https://your-backend.onrender.com';

console.log('🔍 OBS Deployment Diagnostic Tool\n');
console.log('📋 Configuration:');
console.log(`   Frontend (Vercel): ${VERCEL_URL}`);
console.log(`   Backend (Render):  ${RENDER_URL}\n`);

const results = {
    backend: { health: false, api: false, cors: false },
    frontend: { loads: false, api: false },
    issues: []
};

// Helper function to make HTTP requests
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        }).on('error', reject);
    });
}

// Test 1: Backend Health Check
async function testBackendHealth() {
    console.log('🧪 Test 1: Backend Health Check');
    try {
        const response = await makeRequest(`${RENDER_URL}/health`);
        if (response.statusCode === 200) {
            const data = JSON.parse(response.body);
            console.log('   ✅ Backend is healthy');
            console.log(`      Status: ${data.status}`);
            console.log(`      Server: ${data.server}`);
            results.backend.health = true;
        } else {
            console.log(`   ❌ Backend returned status ${response.statusCode}`);
            results.issues.push(`Backend health check failed with status ${response.statusCode}`);
        }
    } catch (error) {
        console.log(`   ❌ Cannot connect to backend: ${error.message}`);
        results.issues.push(`Backend unreachable: ${error.message}`);
    }
    console.log('');
}

// Test 2: Backend API Endpoints
async function testBackendAPI() {
    console.log('🧪 Test 2: Backend API Endpoints');
    const endpoints = ['/api/dashboard', '/api/chain-state'];

    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(`${RENDER_URL}${endpoint}`);
            if (response.statusCode === 200) {
                console.log(`   ✅ ${endpoint} works`);
                results.backend.api = true;
            } else {
                console.log(`   ❌ ${endpoint} returned ${response.statusCode}`);
                results.issues.push(`${endpoint} failed with status ${response.statusCode}`);
            }
        } catch (error) {
            console.log(`   ❌ ${endpoint} error: ${error.message}`);
            results.issues.push(`${endpoint} error: ${error.message}`);
        }
    }
    console.log('');
}

// Test 3: CORS Configuration
async function testCORS() {
    console.log('🧪 Test 3: CORS Configuration');
    try {
        const response = await makeRequest(`${RENDER_URL}/health`);
        const corsHeader = response.headers['access-control-allow-origin'];

        if (corsHeader) {
            console.log(`   ✅ CORS enabled: ${corsHeader}`);
            results.backend.cors = true;

            if (corsHeader === '*' || corsHeader === 'true') {
                console.log('   ⚠️  Warning: CORS allows all origins (not recommended for production)');
            }
        } else {
            console.log('   ❌ CORS header not found');
            results.issues.push('CORS not configured - frontend will not be able to connect');
        }
    } catch (error) {
        console.log(`   ❌ Cannot check CORS: ${error.message}`);
    }
    console.log('');
}

// Test 4: Frontend Loads
async function testFrontend() {
    console.log('🧪 Test 4: Frontend Accessibility');
    try {
        const response = await makeRequest(VERCEL_URL);
        if (response.statusCode === 200 || response.statusCode === 301 || response.statusCode === 302) {
            console.log('   ✅ Frontend is accessible');
            results.frontend.loads = true;
        } else {
            console.log(`   ❌ Frontend returned status ${response.statusCode}`);
            results.issues.push(`Frontend returned unexpected status ${response.statusCode}`);
        }
    } catch (error) {
        console.log(`   ❌ Cannot access frontend: ${error.message}`);
        results.issues.push(`Frontend unreachable: ${error.message}`);
    }
    console.log('');
}

// Test 5: Environment Variable Check
function testEnvironmentVariables() {
    console.log('🧪 Test 5: Environment Variables');

    const requiredVars = {
        'VERCEL_URL': VERCEL_URL,
        'RENDER_URL': RENDER_URL
    };

    let allSet = true;
    for (const [key, value] of Object.entries(requiredVars)) {
        if (value.includes('your-app') || value.includes('your-backend')) {
            console.log(`   ❌ ${key} not configured (still has placeholder)`);
            results.issues.push(`${key} needs to be set to your actual deployment URL`);
            allSet = false;
        } else {
            console.log(`   ✅ ${key} is set`);
        }
    }

    if (!allSet) {
        console.log('\n   💡 Update this script with your actual URLs:');
        console.log('      VERCEL_URL=https://your-app.vercel.app npm run diagnose');
        console.log('      RENDER_URL=https://your-backend.onrender.com npm run diagnose');
    }
    console.log('');
}

// Generate Report
function generateReport() {
    console.log('📊 Diagnostic Report\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Backend Status
    console.log('🖥️  Backend Status:');
    console.log(`   Health Check:    ${results.backend.health ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   API Endpoints:   ${results.backend.api ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   CORS:            ${results.backend.cors ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');

    // Frontend Status
    console.log('🌐 Frontend Status:');
    console.log(`   Accessibility:   ${results.frontend.loads ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');

    // Issues
    if (results.issues.length > 0) {
        console.log('⚠️  Issues Found:\n');
        results.issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. ${issue}`);
        });
        console.log('');
    } else {
        console.log('✅ No issues detected!\n');
    }

    // Recommendations
    console.log('💡 Recommendations:\n');

    if (!results.backend.health) {
        console.log('   1. Check if backend is deployed and running on Render');
        console.log('      - Go to Render Dashboard → Your Service');
        console.log('      - Check if service is "Live"');
        console.log('      - Review logs for errors\n');
    }

    if (!results.backend.cors) {
        console.log('   2. Update CORS configuration in apps/backend/src/server.ts');
        console.log('      - Add your Vercel domain to allowed origins');
        console.log('      - Redeploy backend after changes\n');
    }

    if (!results.frontend.loads) {
        console.log('   3. Check Vercel deployment status');
        console.log('      - Go to Vercel Dashboard → Deployments');
        console.log('      - Check if latest deployment succeeded');
        console.log('      - Review build logs for errors\n');
    }

    if (results.backend.health && results.frontend.loads && results.backend.cors) {
        console.log('   ✅ All systems operational!');
        console.log('   ✅ If features still don\'t work, check:');
        console.log('      1. NEXT_PUBLIC_API_URL is set in Vercel environment variables');
        console.log('      2. Browser console for JavaScript errors');
        console.log('      3. Network tab for failed API requests\n');
    }

    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📖 For detailed troubleshooting, see DEPLOYMENT_TROUBLESHOOTING.md\n');
}

// Run all tests
async function runDiagnostics() {
    await testBackendHealth();
    await testBackendAPI();
    await testCORS();
    await testFrontend();
    testEnvironmentVariables();
    generateReport();
}

// Execute
runDiagnostics().catch(error => {
    console.error('❌ Diagnostic tool error:', error);
    process.exit(1);
});
