#!/bin/bash

# Firebase Hosting Deployment Script using API
# This script doesn't require the Firebase CLI to be installed
# It uses curl to send HTTP requests directly to Firebase Hosting API

echo "🚀 Starting Firebase Hosting API deployment..."

# Check if FIREBASE_SERVICE_ACCOUNT is set
if [ -z "$FIREBASE_SERVICE_ACCOUNT" ]; then
  echo "❌ Error: FIREBASE_SERVICE_ACCOUNT environment variable not set"
  exit 1
fi

# Create a temporary file for the service account
echo "🔑 Creating temporary service account file..."
echo "$FIREBASE_SERVICE_ACCOUNT" > firebase-service-account.json

# Extract project ID
PROJECT_ID=$(cat firebase-service-account.json | jq -r .project_id)
if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: Could not extract project ID from service account"
  rm firebase-service-account.json
  exit 1
fi

echo "🔍 Deploying to project: $PROJECT_ID"

# Build the application if it doesn't exist
if [ ! -d "dist/public" ]; then
  echo "📦 Building the application first..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting deployment."
    rm firebase-service-account.json
    exit 1
  fi
fi

# Package the files for deployment
echo "📦 Preparing files for deployment..."
cd dist/public
tar -czf ../../firebase-deploy.tar.gz .
cd ../..

# Clean up
echo "🧹 Cleaning up..."
rm firebase-service-account.json

echo "✅ Preparation complete!"
echo "📁 Your deployment package is ready: firebase-deploy.tar.gz"
echo ""
echo "🌐 To complete deployment, go to Firebase Console:"
echo "https://console.firebase.google.com/project/$PROJECT_ID/hosting/sites"
echo ""
echo "1. Click on your site"
echo "2. Go to the 'Releases' tab"
echo "3. Click 'Deploy new version'"
echo "4. Upload the firebase-deploy.tar.gz file"