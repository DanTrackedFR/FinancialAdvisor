/**
 * Utility to check environment variables in the client
 * Returns configuration values without sensitive data
 */
export function checkEnvironmentVariables() {
  const variables = {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? 'Set (value hidden)' : 'Missing',
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'Missing',
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Missing',
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'Missing',
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'Missing',
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID ? 'Set (value hidden)' : 'Missing',
    VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'Missing',
  };

  return variables;
}

/**
 * Logs the environment variables to the console (for debugging)
 */
export function logEnvironmentVariables() {
  const variables = checkEnvironmentVariables();
  console.log('Environment Variables:');
  Object.entries(variables).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
}