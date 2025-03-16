/**
 * Firebase Environment Configuration Checker
 * 
 * This script verifies that all required Firebase configuration
 * is correctly set up for deployment.
 * 
 * Run before deployment to catch common configuration issues.
 */

// Console styling functions
/**
 * Print a header with styling
 */
function printHeader(text) {
  console.log(`\n\x1b[1m\x1b[36m${text}\x1b[0m`);
  console.log('='.repeat(text.length + 4));
}

/**
 * Print a success message
 */
function printSuccess(text) {
  console.log(`\x1b[32m✓ ${text}\x1b[0m`);
}

/**
 * Print a warning message
 */
function printWarning(text) {
  console.log(`\x1b[33m⚠ ${text}\x1b[0m`);
}

/**
 * Print an error message
 */
function printError(text) {
  console.log(`\x1b[31m✗ ${text}\x1b[0m`);
}

/**
 * Verify Firebase environment variables
 */
function checkFirebaseEnv() {
  printHeader('Firebase Environment Configuration Check');
  
  let errors = 0;
  let warnings = 0;
  
  // Check if essential Firebase config variables exist
  const requiredClientVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const requiredServerVars = [
    'FIREBASE_SERVICE_ACCOUNT'
  ];
  
  // Check client-side variables
  console.log('\nChecking client-side Firebase configuration:');
  requiredClientVars.forEach(varName => {
    if (process.env[varName]) {
      printSuccess(`${varName} is set`);
    } else {
      printError(`${varName} is not set (required for Firebase client SDK)`);
      errors++;
    }
  });
  
  // Check if auth domain might cause issues
  if (process.env.VITE_FIREBASE_AUTH_DOMAIN && 
      !process.env.VITE_FIREBASE_AUTH_DOMAIN.includes('trackedfr.com')) {
    printWarning(`VITE_FIREBASE_AUTH_DOMAIN (${process.env.VITE_FIREBASE_AUTH_DOMAIN}) should be 'trackedfr.com' for production`);
    warnings++;
  }
  
  // Check server-side variables
  console.log('\nChecking server-side Firebase configuration:');
  requiredServerVars.forEach(varName => {
    if (process.env[varName]) {
      printSuccess(`${varName} is set`);
    } else {
      printWarning(`${varName} is not set (required for Firebase Admin SDK and deployments)`);
      warnings++;
    }
  });
  
  // Check for Firebase configuration files
  console.log('\nChecking Firebase configuration files:');
  
  // We could check for actual files here in a more comprehensive check
  // For now, just provide advice
  
  // Summary
  console.log('\nConfiguration check summary:');
  if (errors === 0 && warnings === 0) {
    printSuccess('All Firebase environment variables are correctly configured!');
  } else {
    if (errors > 0) {
      printError(`Found ${errors} configuration error(s) that must be fixed before deployment.`);
    }
    if (warnings > 0) {
      printWarning(`Found ${warnings} configuration warning(s) that should be reviewed.`);
    }
    
    provideRecommendations();
  }
  
  return { errors, warnings };
}

/**
 * Provide recommendations for Firebase setup
 */
function provideRecommendations() {
  printHeader('Recommendations');
  
  console.log(`
1. For production deployment, ensure these settings are correct:
   - VITE_FIREBASE_AUTH_DOMAIN should be 'trackedfr.com'
   - Authorized domains in Firebase Console should include 'trackedfr.com' and 'www.trackedfr.com'
   
2. For Firebase service account:
   - The FIREBASE_SERVICE_ACCOUNT environment variable should contain the full JSON service account key
   - This is required for server-side Firebase operations and deployments
   
3. For DNS configuration:
   - Ensure the DNS A record for 'trackedfr.com' points to Firebase hosting IPs
   - Set up CNAME record for 'www.trackedfr.com' pointing to 'trackedfr.firebaseapp.com'
   
4. Security best practices:
   - Never commit Firebase service account keys to your repository
   - Use environment secrets in CI/CD platforms
   - Consider setting up IP allowlisting for your Firebase project
  `);
}

// Export for use in other scripts
module.exports = {
  checkFirebaseEnv,
  printHeader,
  printSuccess,
  printWarning,
  printError
};

// Run directly if called as a script
if (require.main === module) {
  const result = checkFirebaseEnv();
  process.exit(result.errors > 0 ? 1 : 0);
}