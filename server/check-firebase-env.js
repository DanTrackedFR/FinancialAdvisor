// Simple script to check Firebase environment variables
console.log("Checking Firebase environment variables:");

// Check server-side Firebase variables
const serverFirebaseVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

console.log("\nServer-side Firebase Variables:");
serverFirebaseVars.forEach(key => {
  console.log(`${key}: ${process.env[key] ? '✅ Set' : '❌ Missing'}`);
});

// Check client-side Firebase variables
const clientFirebaseVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID'
];

console.log("\nClient-side Firebase Variables:");
clientFirebaseVars.forEach(key => {
  console.log(`${key}: ${process.env[key] ? '✅ Set' : '❌ Missing'}`);
});