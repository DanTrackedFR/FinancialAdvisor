
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log("⚙️ Running development environment setup checks...");

// Check Node version
const nodeVersion = process.version;
console.log(`\nNode.js version: ${nodeVersion}`);

// Check if all necessary environment variables are available
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'STRIPE_SECRET_KEY',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

console.log("\nEnvironment Variables Status:");
const missingEnvVars: string[] = [];
requiredEnvVars.forEach(envVar => {
  const status = process.env[envVar] ? '✅ Available' : '❌ Missing';
  console.log(`${envVar}: ${status}`);
  if (!process.env[envVar]) {
    missingEnvVars.push(envVar);
  }
});

// Check package versions
console.log("\nInstalled Package Versions:");
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  console.log(`Firebase Admin: ${dependencies['firebase-admin'] || 'Not installed'}`);
  console.log(`Firebase: ${dependencies['firebase'] || 'Not installed'}`);
  console.log(`React: ${dependencies['react'] || 'Not installed'}`);
  console.log(`Vite: ${dependencies['vite'] || 'Not installed'}`);
} catch (error) {
  console.error("Error reading package.json:", error);
}

// Check network status
console.log("\nNetwork Status:");
try {
  const port = process.env.PORT || 5000;
  console.log(`Server Port: ${port}`);
  
  // Check if port is in use using Node.js
  const net = require('net');
  const server = net.createServer();
  
  server.once('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is already in use. Server might need an alternative port.`);
    } else {
      console.log(`Error checking port: ${err.message}`);
    }
    server.close();
  });
  
  server.once('listening', () => {
    console.log(`✅ Port ${port} is available`);
    server.close();
  });
  
  server.listen(port);
} catch (error) {
  console.error("Error checking network status:", error);
}

// Final report
console.log("\n📋 Setup Diagnosis Summary:");
if (missingEnvVars.length > 0) {
  console.log(`⚠️  Missing ${missingEnvVars.length} environment variables. Consider using .env file for development.`);
} else {
  console.log("✅ All required environment variables are available.");
}

console.log("\n🚀 Development environment check complete! Ready to start the server.");
