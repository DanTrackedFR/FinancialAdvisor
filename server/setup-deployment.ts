
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log("🚀 Running deployment verification checks...");

// Check Node version
const nodeVersion = process.version;
console.log(`\nNode.js version: ${nodeVersion}`);

// Check if build process works
console.log("\n📦 Testing build process:");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("✅ Build successful");
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}

// Verify critical files exist in the dist directory
console.log("\n🔍 Verifying build output:");
const requiredFiles = [
  'index.js',
  'assets'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), 'dist', file);
  const exists = fs.existsSync(filePath);
  console.log(`${file}: ${exists ? '✅ Exists' : '❌ Missing'}`);
  if (!exists) {
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error("❌ Some required files are missing in the build output");
  process.exit(1);
}

// Check if environment variables are set for deployment
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

console.log("\n🔐 Checking environment variables for deployment:");
let missingEnvVars = 0;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.log(`${envVar}: ❌ Missing`);
    missingEnvVars++;
  } else {
    console.log(`${envVar}: ✅ Set`);
  }
}

// Print deployment recommendations
console.log("\n📋 Deployment Readiness Summary:");
if (missingEnvVars > 0) {
  console.log(`⚠️ Warning: ${missingEnvVars} environment variables are missing`);
  console.log("    Make sure to set these in your deployment environment");
} else {
  console.log("✅ All required environment variables are set");
}

if (allFilesExist) {
  console.log("✅ Build output looks good");
} else {
  console.log("❌ Build output has issues");
}

console.log("\n📝 Deployment Configuration Recommendations:");
console.log("1. Set NODE_ENV=production in your deployment environment");
console.log("2. Use 'npm run start' as your deployment run command");
console.log("3. Use 'npm run build' as your deployment build command");
console.log("4. Ensure all Firebase environment variables are set");

console.log("\n🎉 Deployment verification complete!");
