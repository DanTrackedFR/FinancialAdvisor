#!/bin/bash

echo "🚀 Starting deployment process for TrackedFR..."

# Initialize Firebase with service account
echo "🔑 Creating temporary service account file..."
echo $FIREBASE_SERVICE_ACCOUNT > firebase-service-account.json

# Create the firebase.json file if it doesn't exist
if [ ! -f firebase.json ]; then
  echo "📝 Creating firebase.json configuration..."
  cat > firebase.json << 'EOL'
{
  "hosting": {
    "public": "dist/public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
EOL
fi

# Create the .firebaserc file if it doesn't exist
if [ ! -f .firebaserc ]; then
  echo "📝 Creating .firebaserc configuration..."
  cat > .firebaserc << 'EOL'
{
  "projects": {
    "default": "trackedfr"
  }
}
EOL
fi

# Deploy to Firebase using npx
echo "🚀 Deploying to Firebase..."
export GOOGLE_APPLICATION_CREDENTIALS="firebase-service-account.json"
npx firebase-tools deploy --only hosting --json

# Clean up
echo "🧹 Cleaning up..."
rm firebase-service-account.json

echo "✅ Deployment complete! Your site should now be live at https://trackedfr.com"