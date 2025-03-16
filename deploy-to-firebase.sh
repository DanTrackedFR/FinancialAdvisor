#!/bin/bash

# TrackedFR Firebase Deployment Script
# This script builds and deploys the TrackedFR application to Firebase Hosting

# Print ASCII art header
cat << "EOF"
  ______                __           _______ _____  
 /_  __/________ _____/ /_____  ___/ / ___// ___/  
  / / / ___/ __ `/ __  / /_  / / / /\__ \/ __ \    
 / / / /  / /_/ / /_/ / / / /_/ / /___/ / /_/ /    
/_/ /_/   \__,_/\__,_/_/ /\__, /_//____/\____/     
                          /____/                    

Firebase Deployment Script
EOF

echo "This script will build and deploy TrackedFR to Firebase Hosting."
echo "There are two deployment methods available:"
echo ""
echo "1. JavaScript Deployment Script (Recommended)"
echo "   * Comprehensive error handling"
echo "   * Automatic environment validation"
echo "   * Detailed deployment output"
echo ""
echo "2. Shell Script Deployment"
echo "   * Simpler fallback option"
echo "   * Direct deployment via shell commands"
echo "   * Less detailed output"
echo ""

# Check if the -s flag is passed to skip the prompt and use the shell script
if [ "$1" == "-s" ]; then
  CHOICE="2"
else
  read -p "Which deployment method do you want to use? (1/2): " CHOICE
fi

case $CHOICE in
  1)
    echo "Running JavaScript deployment script..."
    # Check if the build directory exists
    if [ ! -d "dist/public" ]; then
      echo "Building the application first..."
      npm run build
    fi
    
    # Run the JavaScript deployment script
    node firebase-deploy-script.js
    ;;
    
  2)
    echo "Running shell script deployment..."
    
    # Check if Firebase configurations exist
    echo "Checking Firebase configuration..."
    
    if [ ! -f "firebase.json" ]; then
      echo "firebase.json not found. Creating a default configuration..."
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
    else
      echo "✓ firebase.json found"
    fi

    if [ ! -f ".firebaserc" ]; then
      echo ".firebaserc not found. Creating a default configuration..."
      cat > .firebaserc << 'EOL'
{
  "projects": {
    "default": "trackedfr"
  }
}
EOL
    else
      echo "✓ .firebaserc found"
    fi
    
    # Build the application if needed
    if [ ! -d "dist/public" ]; then
      echo "Building the application..."
      npm run build
      
      if [ $? -ne 0 ]; then
        echo "Build failed. Check the build output for errors."
        exit 1
      fi
    fi
    
    # Deploy with service account if available
    if [ -n "$FIREBASE_SERVICE_ACCOUNT" ]; then
      echo "Deploying with service account..."
      
      # Create temporary service account file
      echo "$FIREBASE_SERVICE_ACCOUNT" > firebase-service-account.json
      export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/firebase-service-account.json"
      
      # Deploy with npx
      echo "Running deployment command..."
      npx firebase-tools deploy --only hosting
      
      DEPLOY_STATUS=$?
      
      # Clean up
      rm firebase-service-account.json
      
      if [ $DEPLOY_STATUS -ne 0 ]; then
        echo "Deployment failed. Creating a deployment package instead..."
        cd dist/public
        tar -czf ../../firebase-deploy.tar.gz .
        cd ../..
        echo "Deployment package created: firebase-deploy.tar.gz"
        echo "You can manually upload this package to Firebase Console."
      else
        echo "Deployment successful!"
      fi
    else
      echo "FIREBASE_SERVICE_ACCOUNT not found. Creating a deployment package instead..."
      cd dist/public
      tar -czf ../../firebase-deploy.tar.gz .
      cd ../..
      echo "Deployment package created: firebase-deploy.tar.gz"
      echo "You can manually upload this package to Firebase Console."
    fi
    ;;
    
  *)
    echo "Invalid choice. Please run the script again and select 1 or 2."
    exit 1
    ;;
esac

echo ""
echo "Your site will be available at:"
echo "https://trackedfr.com"
echo "https://trackedfr.web.app"
echo ""