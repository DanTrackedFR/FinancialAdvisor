/**
 * TrackedFR Manual Deployment Preparation Script
 * 
 * This script creates a deployment package for manual upload to Firebase Console.
 * It builds the application and creates a zip file that can be uploaded directly.
 * 
 * Usage:
 *   node prepare-manual-upload.js
 */

import { exec } from 'child_process';
import { writeFileSync, existsSync, mkdirSync, createWriteStream } from 'fs';
import { promisify } from 'util';
import path from 'path';
import archiver from 'archiver';

const execPromise = promisify(exec);

// Constants
const BUILD_FOLDER = 'dist/public';
const OUTPUT_FILE = 'firebase-deployment-package.zip';

// ANSI color codes
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

/**
 * Logs a styled message to the console
 */
function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

/**
 * Builds the application using npm
 */
async function buildApplication() {
  log("\n🔨 Building the application...", YELLOW);
  
  try {
    const { stdout, stderr } = await execPromise('npm run build');
    
    if (!existsSync(BUILD_FOLDER)) {
      throw new Error(`Build folder ${BUILD_FOLDER} was not created.`);
    }
    
    log("✅ Application built successfully!", GREEN);
    return true;
  } catch (error) {
    log(`❌ Build failed: ${error.message}`, RED);
    
    if (error.stderr) {
      log("Build error details:", RED);
      console.error(error.stderr);
    }
    
    return false;
  }
}

/**
 * Creates a zip archive of the build folder
 */
function createDeploymentPackage() {
  return new Promise((resolve, reject) => {
    log("\n📦 Creating deployment package...", YELLOW);
    
    const output = createWriteStream(OUTPUT_FILE);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    output.on('close', () => {
      const fileSize = (archive.pointer() / 1024 / 1024).toFixed(2);
      log(`✅ Deployment package created: ${OUTPUT_FILE} (${fileSize} MB)`, GREEN);
      resolve(true);
    });
    
    archive.on('error', (err) => {
      log(`❌ Error creating deployment package: ${err.message}`, RED);
      reject(err);
    });
    
    archive.pipe(output);
    archive.directory(BUILD_FOLDER, false);
    archive.finalize();
  });
}

/**
 * Displays manual deployment instructions
 */
function displayInstructions() {
  log("\n📋 Manual Deployment Instructions:", BOLD);
  log("------------------------------------------------");
  log("1. Go to Firebase Console: https://console.firebase.google.com");
  log("2. Select your project: 'trackedfr'");
  log("3. Navigate to Hosting section");
  log("4. Click 'Upload Files' or 'Add site' if you haven't set it up yet");
  log("5. Upload the generated file: " + OUTPUT_FILE);
  log("6. Follow the prompts in the Firebase Console to complete deployment");
  log("");
  log("🌐 Your site will be available at:");
  log(`   ${BOLD}https://trackedfr.com${RESET}`);
  log(`   ${BOLD}https://trackedfr.web.app${RESET}`);
  log("------------------------------------------------");
}

/**
 * Main function
 */
async function main() {
  log(`\n${BOLD}TrackedFR Manual Deployment Preparation${RESET}`, BOLD);
  log("This script prepares a deployment package for manual upload.");
  
  try {
    // Check if build folder already exists
    let buildSuccessful = existsSync(BUILD_FOLDER);
    
    if (buildSuccessful) {
      log("📂 Existing build folder found. Skipping build step.", YELLOW);
      const proceed = await promptYesNo("Do you want to use the existing build? (y/n)");
      
      if (!proceed) {
        buildSuccessful = await buildApplication();
      }
    } else {
      buildSuccessful = await buildApplication();
    }
    
    if (!buildSuccessful) {
      log("❌ Cannot proceed without a successful build.", RED);
      return;
    }
    
    await createDeploymentPackage();
    displayInstructions();
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, RED);
  }
}

/**
 * Simple Yes/No prompt (This is a mock since we're not adding dependencies)
 * In a real implementation, you would use a package like inquirer or prompt-sync
 */
function promptYesNo(question) {
  // For now, just assume yes 
  console.log(`${question} (Assuming yes for this demo)`);
  return Promise.resolve(true);
}

// Execute main function
main().catch(error => {
  log(`❌ Unhandled error: ${error.message}`, RED);
  process.exit(1);
});