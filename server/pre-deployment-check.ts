
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import net from 'net';

console.log("🚀 Running pre-deployment checks...");

// Check Firebase environment variables
const requiredFirebaseVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

console.log("\n📋 Firebase Configuration Status:");
const missingFirebaseVars: string[] = [];
requiredFirebaseVars.forEach(envVar => {
  const status = process.env[envVar] ? '✅ Available' : '❌ Missing';
  console.log(`${envVar}: ${status}`);
  if (!process.env[envVar]) {
    missingFirebaseVars.push(envVar);
  }
});

// Check client Firebase environment variables
const requiredClientFirebaseVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

console.log("\n📋 Client Firebase Configuration Status:");
const missingClientFirebaseVars: string[] = [];
requiredClientFirebaseVars.forEach(envVar => {
  const status = process.env[envVar] ? '✅ Available' : '❌ Missing';
  console.log(`${envVar}: ${status}`);
  if (!process.env[envVar]) {
    missingClientFirebaseVars.push(envVar);
  }
});

// Check if Firebase admin can be initialized
let firebaseAdminStatus = '❌ Failed';
try {
  // Import dynamically to avoid initialization errors
  const adminModule = await import('./lib/firebase-admin.js');
  firebaseAdminStatus = '✅ Initialized Successfully';
} catch (error) {
  console.error("Error importing Firebase admin:", error);
}
console.log(`\nFirebase Admin SDK: ${firebaseAdminStatus}`);

// Check if port is available
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

// Release port if needed
async function releasePort(port: number): Promise<boolean> {
  try {
    console.log(`Attempting to release port ${port}...`);
    // Try to kill any process using the port
    await import('child_process').then(({ execSync }) => {
      try {
        execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
      } catch (e) {
        // Command may fail if port not in use or fuser not available
      }
    });
    
    // Check if port is now available
    return await isPortAvailable(port);
  } catch (error) {
    console.error(`Error releasing port ${port}:`, error);
    return false;
  }
}

const port = Number(process.env.PORT) || 5000;
let isPortFree = await isPortAvailable(port);

if (!isPortFree) {
  console.log(`Port ${port} is in use. Attempting to release...`);
  isPortFree = await releasePort(port);
}

console.log(`\nPort ${port} status: ${isPortFree ? '✅ Available' : '❌ In use'}`);

// Summary and recommendations
console.log("\n📊 Deployment Readiness Summary:");

const issues: string[] = [];

if (missingFirebaseVars.length > 0) {
  issues.push(`Missing ${missingFirebaseVars.length} Firebase server environment variables`);
}

if (missingClientFirebaseVars.length > 0) {
  issues.push(`Missing ${missingClientFirebaseVars.length} Firebase client environment variables`);
}

if (firebaseAdminStatus.includes('❌')) {
  issues.push("Firebase Admin SDK initialization failed");
}

if (!isPortFree) {
  issues.push(`Port ${port} is already in use`);
}

if (issues.length === 0) {
  console.log("✅ All checks passed! Your application is ready for deployment.");
} else {
  console.log("❌ Issues found that may prevent successful deployment:");
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
  
  console.log("\n🔧 Recommended fixes:");
  
  if (missingFirebaseVars.length > 0 || missingClientFirebaseVars.length > 0) {
    console.log("• Set up all required Firebase environment variables in your deployment configuration");
  }
  
  if (firebaseAdminStatus.includes('❌')) {
    console.log("• Check your Firebase Admin SDK initialization code and make sure the dependencies are installed");
  }
  
  if (!isPortFree) {
    console.log(`• Ensure no other process is using port ${port} or change the PORT environment variable`);
  }
}

console.log("\n🔍 Pre-deployment check complete!");
