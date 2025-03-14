#!/bin/bash

# Firebase Hosting API Deployment Script
# This script uses the Firebase Hosting REST API to deploy without requiring interactive login

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${BLUE}===== $1 =====${NC}\n"
}

# Function to print success messages
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning messages
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error messages
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Check for required environment variables
print_header "Checking Prerequisites"

if [ -z "$FIREBASE_API_KEY" ]; then
  print_error "FIREBASE_API_KEY environment variable not set"
  echo "Please set it using: export FIREBASE_API_KEY=your_api_key"
  exit 1
fi

if [ -z "$FIREBASE_PROJECT_ID" ]; then
  print_warning "FIREBASE_PROJECT_ID environment variable not set, using default"
  FIREBASE_PROJECT_ID="trackedfr"
fi

# Build the application
print_header "Building the application"
echo "Running npm run build..."
if npm run build; then
  print_success "Build completed successfully."
else
  print_error "Build failed. Stopping deployment."
  exit 1
fi

# Check build output
if [ -d "./dist" ] && [ -d "./dist/public" ] && [ -f "./dist/public/index.html" ]; then
  print_success "Build output verified."
else
  print_error "Build output not found or incomplete."
  echo "Expected to find ./dist/public/index.html"
  exit 1
fi

print_header "Creating deployment package"
# Create a ZIP file of the build output
cd dist/public
zip -r ../../firebase-deploy.zip .
cd ../..

if [ ! -f "./firebase-deploy.zip" ]; then
  print_error "Failed to create deployment package"
  exit 1
fi

print_success "Created deployment package: firebase-deploy.zip"

print_header "Alternative Deployment Options"

print_warning "Since we're unable to deploy directly from Replit, here are your options:"

echo -e "1. ${YELLOW}Deploy via Firebase CLI on your local machine:${NC}"
echo "   • Download this project to your local machine"
echo "   • Run: firebase login"
echo "   • Run: firebase deploy --only hosting"
echo ""

echo -e "2. ${YELLOW}Set up GitHub Actions:${NC}"
echo "   • Push this project to GitHub"
echo "   • Set up GitHub Actions for Firebase deployment"
echo "   • Firebase will automatically deploy when you push changes"
echo ""

echo -e "3. ${YELLOW}Manual upload via Firebase Console:${NC}"
echo "   • Download the ./firebase-deploy.zip file"
echo "   • Extract it on your local machine"
echo "   • Go to Firebase Console: https://console.firebase.google.com/project/trackedfr/hosting"
echo "   • Click 'Upload' and select the extracted files"
echo ""

echo -e "4. ${YELLOW}Use Firebase Hosting Preview Channels:${NC}"
echo "   • On your local machine: firebase hosting:channel:deploy preview"
echo "   • This creates a temporary URL for testing"
echo "   • Promote to production when ready: firebase hosting:channel:deploy production"
echo ""

print_warning "Important Firebase Project Settings"
echo "• Ensure 'trackedfr.com' and 'www.trackedfr.com' are added to:"
echo "  Firebase Console > Authentication > Settings > Authorized domains"
echo "• Verify your DNS settings are correctly pointing to Firebase"
echo "• Update .env files to use 'trackedfr.com' as the authentication domain"

print_header "Need Help?"
echo "If you're still having trouble, consider:"
echo "1. Setting up a local development environment where you can run Firebase CLI directly"
echo "2. Using a CI/CD service that integrates with Firebase (GitHub Actions, CircleCI, etc.)"
echo "3. Creating a simple Node.js script that uses the firebase-admin SDK with a service account"