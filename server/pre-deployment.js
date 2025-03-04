
// Pre-deployment script to check port availability and credentials
import net from 'net';
import fs from 'fs';

console.log("🚀 Running pre-deployment checks...");

// Function to check if a port is in use
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      console.log(`Port ${port} is already in use`);
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      console.log(`Port ${port} is available`);
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

// Check Firebase environment variables
const requiredFirebaseVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

console.log("\n📋 Firebase Configuration Status:");
const missingFirebaseVars = [];
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
const missingClientFirebaseVars = [];
requiredClientFirebaseVars.forEach(envVar => {
  const status = process.env[envVar] ? '✅ Available' : '❌ Missing';
  console.log(`${envVar}: ${status}`);
  if (!process.env[envVar]) {
    missingClientFirebaseVars.push(envVar);
  }
});

// Check deployment port
const port = Number(process.env.PORT) || 8080;
console.log(`\nChecking availability of port ${port}...`);

isPortAvailable(port).then(available => {
  if (!available) {
    console.log(`⚠️ Warning: Port ${port} is already in use. The deployment may fail.`);
    console.log('Consider releasing any processes using this port before deployment.');
  } else {
    console.log(`✅ Port ${port} is available and ready for deployment.`);
  }
  
  // Summary and recommendations
  console.log("\n📊 Deployment Readiness Summary:");
  const issues = [];

  if (missingFirebaseVars.length > 0) {
    issues.push(`Missing ${missingFirebaseVars.length} Firebase server environment variables`);
  }

  if (missingClientFirebaseVars.length > 0) {
    issues.push(`Missing ${missingClientFirebaseVars.length} Firebase client environment variables`);
  }

  if (!available) {
    issues.push(`Port ${port} is already in use`);
  }

  if (issues.length === 0) {
    console.log("✅ All checks passed! Your application is ready for deployment.");
  } else {
    console.log("⚠️ Issues found that may affect deployment:");
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    
    console.log("\n🔧 Recommended fixes:");
    
    if (missingFirebaseVars.length > 0 || missingClientFirebaseVars.length > 0) {
      console.log("• Set up all required Firebase environment variables in your deployment configuration");
    }
    
    if (!available) {
      console.log(`• Ensure no other process is using port ${port} or change the PORT environment variable`);
    }
  }
});
