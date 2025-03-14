#!/bin/bash

echo "🚀 Starting deployment process..."

# Build the application
echo "📦 Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi

# Install firebase-tools if not already installed
if ! command -v firebase &> /dev/null; then
    echo "📥 Installing Firebase CLI tools..."
    npm install -g firebase-tools
fi

# Initialize Firebase with service account
echo "🔑 Initializing Firebase with service account..."
export GOOGLE_APPLICATION_CREDENTIALS="firebase-service-account.json"

# Create temporary service account file
echo "📝 Creating temporary service account file..."
echo $FIREBASE_SERVICE_ACCOUNT > firebase-service-account.json

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting --non-interactive --token $(echo $FIREBASE_SERVICE_ACCOUNT | jq -r .private_key)

# Clean up
echo "🧹 Cleaning up..."
rm firebase-service-account.json

echo "✅ Deployment complete!"