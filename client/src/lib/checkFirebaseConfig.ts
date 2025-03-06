import { firebaseConfig } from './firebaseConfig';

/**
 * Utility function to check if Firebase configuration is loaded correctly
 * Returns an object with status of each configuration property
 */
export function checkFirebaseConfig() {
  return {
    apiKey: !!firebaseConfig.apiKey,
    authDomain: !!firebaseConfig.authDomain,
    projectId: !!firebaseConfig.projectId,
    storageBucket: !!firebaseConfig.storageBucket,
    messagingSenderId: !!firebaseConfig.messagingSenderId,
    appId: !!firebaseConfig.appId,
    measurementId: !!firebaseConfig.measurementId
  };
}

/**
 * Logs the status of Firebase configuration to console
 * Only for development use
 */
export function logFirebaseConfigStatus() {
  const config = checkFirebaseConfig();
  console.log('Firebase Configuration Status:');
  Object.entries(config).forEach(([key, value]) => {
    console.log(`${key}: ${value ? '✅ Available' : '❌ Missing'}`);
  });
  
  // Return missing keys
  const missingKeys = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  return missingKeys;
}