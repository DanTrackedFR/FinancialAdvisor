/**
 * Firebase Environment and Domain Checker
 * 
 * This script verifies the Firebase configuration and domain setup
 * to help troubleshoot authentication and domain-related issues.
 */

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Print a formatted section header
 */
function printHeader(text) {
  console.log(`\n${colors.blue}${colors.bright}${text}${colors.reset}\n`);
}

/**
 * Print a success message
 */
function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

/**
 * Print a warning message
 */
function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

/**
 * Print an error message
 */
function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

/**
 * Verify Firebase environment variables
 */
function checkFirebaseEnv() {
  printHeader("Checking Firebase Environment Variables");
  
  // Client-side Firebase config (VITE_ prefixed)
  const clientVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  // Server-side Firebase config
  const serverVars = [
    'FIREBASE_SERVICE_ACCOUNT', // This should be a JSON string
    'FIREBASE_PROJECT_ID'
  ];
  
  let clientMissing = 0;
  let serverMissing = 0;
  
  // Check client-side variables
  console.log("Client-side Firebase variables:");
  clientVars.forEach(varName => {
    if (process.env[varName]) {
      const value = varName === 'VITE_FIREBASE_API_KEY' 
        ? process.env[varName].substring(0, 5) + '...' // Truncate API key for security
        : process.env[varName];
      printSuccess(`${varName}: ${value}`);
    } else {
      printError(`${varName}: Not set`);
      clientMissing++;
    }
  });
  
  // Check server-side variables
  console.log("\nServer-side Firebase variables:");
  serverVars.forEach(varName => {
    if (process.env[varName]) {
      if (varName === 'FIREBASE_SERVICE_ACCOUNT') {
        try {
          // Try to parse as JSON to verify it's valid
          const serviceAccount = JSON.parse(process.env[varName]);
          if (serviceAccount.project_id) {
            printSuccess(`${varName}: Valid (project: ${serviceAccount.project_id})`);
          } else {
            printWarning(`${varName}: Missing project_id field`);
          }
        } catch (e) {
          printError(`${varName}: Invalid JSON format`);
          serverMissing++;
        }
      } else {
        printSuccess(`${varName}: ${process.env[varName]}`);
      }
    } else {
      printError(`${varName}: Not set`);
      serverMissing++;
    }
  });
  
  // Summary
  console.log('\nEnvironment variables summary:');
  if (clientMissing === 0) {
    printSuccess('All client-side Firebase variables are set');
  } else {
    printError(`${clientMissing} client-side Firebase variables are missing`);
  }
  
  if (serverMissing === 0) {
    printSuccess('All server-side Firebase variables are set');
  } else {
    printError(`${serverMissing} server-side Firebase variables are missing`);
  }
  
  // Check for domain-specific settings
  printHeader("Domain-specific Configuration");
  
  // Check AUTH_DOMAIN setting
  const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN || '';
  if (authDomain.includes('trackedfr.com')) {
    printSuccess(`Auth domain is using custom domain: ${authDomain}`);
  } else {
    printWarning(`Auth domain is not using custom domain: ${authDomain}`);
    console.log(`For production with custom domain, set VITE_FIREBASE_AUTH_DOMAIN=trackedfr.com`);
  }
}

/**
 * Provide recommendations for Firebase setup
 */
function provideRecommendations() {
  printHeader("Firebase Domain Recommendations");
  
  console.log("For proper custom domain setup with Firebase Authentication:");
  console.log("1. Add these domains in Firebase Console > Authentication > Settings > Authorized domains:");
  console.log("   - trackedfr.com");
  console.log("   - www.trackedfr.com");
  console.log("\n2. Update DNS settings:");
  console.log("   - A record for trackedfr.com pointing to Firebase's IP addresses");
  console.log("   - CNAME for www.trackedfr.com pointing to trackedfr.firebaseapp.com");
  console.log("\n3. Update environment variables:");
  console.log("   - Set VITE_FIREBASE_AUTH_DOMAIN=trackedfr.com");
  
  // Check if we can provide more specific recommendations based on the current setup
  const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN || '';
  if (!authDomain.includes('trackedfr.com')) {
    printWarning("Current auth domain doesn't match production domain");
    console.log(`Current: ${authDomain}`);
    console.log("Recommended: trackedfr.com");
  }
}

// Run the checks
checkFirebaseEnv();
provideRecommendations();

// Export functions for potential use in other files
module.exports = {
  checkFirebaseEnv,
  provideRecommendations
};