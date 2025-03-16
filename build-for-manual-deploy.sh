#!/bin/bash

echo "📦 Building TrackedFR for deployment..."

# Build the application
echo "🔨 Running npm build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check for errors."
    exit 1
fi

echo "🗜️ Creating deployment package..."
cd dist/public
tar -czf ../../firebase-deploy.tar.gz .
cd ../..

echo "✅ Build complete!"
echo "📁 Your deployment package is ready: firebase-deploy.tar.gz"
echo ""
echo "🌐 To deploy manually:"
echo "1. Download firebase-deploy.tar.gz from Replit"
echo "2. Extract the files to a folder on your computer"
echo "3. Open Firebase Console (https://console.firebase.google.com)"
echo "4. Go to your project > Hosting > Get started or Manage"
echo "5. Click 'Add another site' if needed"
echo "6. Follow the instructions to deploy your files"
echo ""
echo "🚀 Alternatively, run ./deploy-with-token.sh to deploy directly from Replit"