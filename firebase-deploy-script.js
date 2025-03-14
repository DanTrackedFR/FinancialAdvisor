/**
 * Firebase Hosting Deployment Script
 * This script deploys the built application to Firebase Hosting directly
 * without requiring interactive login.
 * 
 * Prerequisites:
 * 1. Set FIREBASE_SERVICE_ACCOUNT environment variable with the JSON service account key
 * 2. Run npm run build before running this script
 * 3. Install required dependencies: npm install firebase-admin firebase-tools
 */

const admin = require('firebase-admin');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Print a formatted header
 */
function printHeader(text) {
  console.log(`\n${colors.blue}===== ${text} =====${colors.reset}\n`);
}

/**
 * Print a success message
 */
function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

/**
 * Print an error message
 */
function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

/**
 * Print a warning message
 */
function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

/**
 * Verify build output exists
 */
function verifyBuildOutput() {
  printHeader('Verifying Build Output');
  
  const distPath = path.join(__dirname, 'dist');
  const publicPath = path.join(distPath, 'public');
  const indexPath = path.join(publicPath, 'index.html');
  
  if (!fs.existsSync(distPath)) {
    printError('dist directory not found. Run npm run build first.');
    return false;
  }
  
  if (!fs.existsSync(publicPath)) {
    printError('dist/public directory not found. Make sure the build process is correct.');
    return false;
  }
  
  if (!fs.existsSync(indexPath)) {
    printError('dist/public/index.html not found. Build may be incomplete.');
    return false;
  }
  
  printSuccess('Build output verified successfully.');
  return true;
}

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebaseAdmin() {
  printHeader('Initializing Firebase Admin SDK');
  
  try {
    // Check if service account is provided as environment variable
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
      printError('FIREBASE_SERVICE_ACCOUNT environment variable not set.');
      return false;
    }
    
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountString);
    } catch (error) {
      printError('Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON.');
      console.error(error);
      return false;
    }
    
    // Initialize the Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    printSuccess('Firebase Admin SDK initialized successfully.');
    return true;
  } catch (error) {
    printError('Failed to initialize Firebase Admin SDK.');
    console.error(error);
    return false;
  }
}

/**
 * Deploy to Firebase Hosting
 */
async function deployToFirebaseHosting() {
  printHeader('Deploying to Firebase Hosting');
  
  try {
    // Generate a temporary token for deployment
    const firebaseToken = await admin.auth().createCustomToken('deploy-user');
    
    // Set environment variable for the token
    process.env.FIREBASE_TOKEN = firebaseToken;
    
    // Run firebase deploy
    console.log('Running firebase deploy command...');
    execSync('npx firebase-tools deploy --only hosting --token "$FIREBASE_TOKEN"', {
      stdio: 'inherit',
      env: process.env
    });
    
    printSuccess('Deployment completed successfully!');
    return true;
  } catch (error) {
    printError('Deployment failed.');
    console.error(error);
    return false;
  }
}

/**
 * Display manual deployment instructions
 */
function displayManualInstructions() {
  printHeader('Alternative Deployment Options');
  
  printWarning('Since automatic deployment is difficult in Replit, consider these alternatives:');
  
  console.log(`${colors.yellow}1. Deploy via Firebase CLI on your local machine:${colors.reset}`);
  console.log('   • Download this project to your local machine');
  console.log('   • Run: firebase login');
  console.log('   • Run: firebase deploy --only hosting');
  console.log('');
  
  console.log(`${colors.yellow}2. Set up GitHub Actions:${colors.reset}`);
  console.log('   • Push this project to GitHub');
  console.log('   • Set up GitHub Actions for Firebase deployment');
  console.log('   • Firebase will automatically deploy when you push changes');
  console.log('');
  
  console.log(`${colors.yellow}3. Manual upload via Firebase Console:${colors.reset}`);
  console.log('   • Create a ZIP of the ./dist/public directory');
  console.log('   • Download it to your local machine and extract it');
  console.log('   • Go to Firebase Console: https://console.firebase.google.com/project/trackedfr/hosting');
  console.log('   • Click "Upload" and select the extracted files');
  console.log('');
  
  printWarning('Important Firebase Project Settings');
  console.log('• Ensure "trackedfr.com" and "www.trackedfr.com" are added to:');
  console.log('  Firebase Console > Authentication > Settings > Authorized domains');
  console.log('• Verify your DNS settings are correctly pointing to Firebase');
  console.log('• Update .env files to use "trackedfr.com" as the authentication domain');
}

/**
 * Main function
 */
async function main() {
  printHeader('Firebase Hosting Deployment Script');
  
  // Verify build output
  if (!verifyBuildOutput()) {
    displayManualInstructions();
    process.exit(1);
  }
  
  // Try to initialize Firebase Admin and deploy
  // Note: This approach has limitations and may not work in Replit environment
  if (initializeFirebaseAdmin()) {
    try {
      await deployToFirebaseHosting();
    } catch (error) {
      printError('Deployment failed unexpectedly.');
      console.error(error);
      displayManualInstructions();
      process.exit(1);
    }
  } else {
    printWarning('Firebase Admin SDK initialization failed. Showing manual instructions instead.');
    displayManualInstructions();
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  printError('Unexpected error occurred:');
  console.error(error);
  displayManualInstructions();
  process.exit(1);
});