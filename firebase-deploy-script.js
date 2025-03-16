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

import { initializeApp, cert } from 'firebase-admin/app';
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ANSI color codes for console output
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";

/**
 * Print a formatted header
 */
function printHeader(text) {
  console.log(`\n${BOLD}${CYAN}${text}${RESET}`);
  console.log("=".repeat(text.length));
}

/**
 * Print a success message
 */
function printSuccess(text) {
  console.log(`${GREEN}✓ ${text}${RESET}`);
}

/**
 * Print an error message
 */
function printError(text) {
  console.log(`${RED}✗ ${text}${RESET}`);
}

/**
 * Print a warning message
 */
function printWarning(text) {
  console.log(`${YELLOW}⚠ ${text}${RESET}`);
}

/**
 * Verify build output exists
 */
function verifyBuildOutput() {
  printHeader("Verifying Build Output");
  
  const buildPath = path.join(process.cwd(), 'dist', 'public');
  
  try {
    const stats = fs.statSync(buildPath);
    if (!stats.isDirectory()) {
      throw new Error("Build path is not a directory");
    }
    
    const indexPath = path.join(buildPath, 'index.html');
    fs.statSync(indexPath);
    
    printSuccess(`Build output verified: ${buildPath}`);
    return true;
  } catch (error) {
    printError(`Build output not found: ${error.message}`);
    printWarning("Please run 'npm run build' before deployment");
    return false;
  }
}

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebaseAdmin() {
  printHeader("Initializing Firebase Admin SDK");
  
  try {
    // Check for service account in environment variable
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountEnv) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable not set");
    }
    
    // Parse service account JSON
    const serviceAccount = JSON.parse(serviceAccountEnv);
    
    // Initialize Firebase Admin
    initializeApp({
      credential: cert(serviceAccount)
    });
    
    printSuccess(`Firebase Admin SDK initialized with project: ${serviceAccount.project_id}`);
    return { success: true, projectId: serviceAccount.project_id };
  } catch (error) {
    printError(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Deploy to Firebase Hosting
 */
async function deployToFirebaseHosting() {
  printHeader("Deploying to Firebase Hosting");
  
  try {
    // Temporarily create a file for credentials
    const tempServiceAccountPath = path.join(process.cwd(), 'firebase-service-account-temp.json');
    await fs.writeFile(tempServiceAccountPath, process.env.FIREBASE_SERVICE_ACCOUNT);
    
    // Set path as environment variable for firebase-tools
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempServiceAccountPath;
    
    // Run the firebase deploy command
    console.log("Running deployment...");
    const output = execSync('npx firebase-tools deploy --only hosting --json', { 
      encoding: 'utf8', 
      stdio: 'pipe'
    });
    
    // Clean up temporary file
    await fs.unlink(tempServiceAccountPath);
    
    // Parse the deployment result
    const result = JSON.parse(output);
    
    if (result.status === 'success') {
      printSuccess("Deployment completed successfully!");
      console.log(`\n${BOLD}Your site is now live at:${RESET}`);
      console.log(`• https://trackedfr.com`);
      console.log(`• https://trackedfr.web.app`);
      
      // If result has details, print them
      if (result.result && result.result.hosting) {
        const hostingResult = result.result.hosting;
        console.log(`\n${BOLD}Deployment details:${RESET}`);
        console.log(`• Version: ${hostingResult.version}`);
        console.log(`• Updated files: ${hostingResult.updatedFiles || 0}`);
        console.log(`• Deleted files: ${hostingResult.deletedFiles || 0}`);
      }
      
      return { success: true };
    } else {
      throw new Error(result.error || "Unknown deployment error");
    }
  } catch (error) {
    printError(`Deployment failed: ${error.message}`);
    
    // Check if the error might be due to missing firebase-tools
    if (error.message.includes('firebase-tools')) {
      printWarning("It appears firebase-tools is not installed. Installing it now...");
      
      try {
        execSync('npm install firebase-tools --no-save', { stdio: 'inherit' });
        printSuccess("firebase-tools installed. Please run this script again.");
      } catch (installError) {
        printError(`Failed to install firebase-tools: ${installError.message}`);
      }
    }
    
    // Provide alternate deployment instructions
    displayManualInstructions();
    
    return { 
      success: false, 
      error: error.message
    };
  }
}

/**
 * Display manual deployment instructions
 */
function displayManualInstructions() {
  printHeader("Manual Deployment Instructions");
  
  console.log(`${YELLOW}If automated deployment fails, you can deploy manually:${RESET}`);
  console.log("\n1. Install Firebase CLI globally:");
  console.log("   npm install -g firebase-tools");
  
  console.log("\n2. Login to Firebase:");
  console.log("   firebase login");
  
  console.log("\n3. Deploy the application:");
  console.log("   firebase deploy --only hosting");
  
  console.log("\nAlternatively, you can use the Firebase Console to deploy:");
  console.log("1. Go to https://console.firebase.google.com/project/trackedfr/hosting");
  console.log("2. Click 'Get started' or 'Add another site'");
  console.log("3. Follow the instructions to upload your dist/public folder");
}

/**
 * Main function
 */
async function main() {
  console.log(`${BOLD}TrackedFR Firebase Deployment Script${RESET}`);
  console.log("This script deploys the application to Firebase Hosting");
  
  // Verify build output
  if (!verifyBuildOutput()) {
    process.exit(1);
  }
  
  // Initialize Firebase Admin
  const adminResult = initializeFirebaseAdmin();
  if (!adminResult.success) {
    process.exit(1);
  }
  
  // Deploy to Firebase Hosting
  const deployResult = await deployToFirebaseHosting();
  
  if (deployResult.success) {
    console.log(`\n${BOLD}${GREEN}Deployment completed successfully!${RESET}`);
    process.exit(0);
  } else {
    console.log(`\n${BOLD}${RED}Deployment failed.${RESET} Please check the errors above.`);
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  main().catch(error => {
    printError(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

export {
  verifyBuildOutput,
  initializeFirebaseAdmin,
  deployToFirebaseHosting
};