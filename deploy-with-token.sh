#!/bin/bash

# Firebase Deployment with Token Script
# Uses a token stored in Replit Secrets

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions for nice output
print_header() { echo -e "\n${BLUE}===== $1 =====${NC}\n"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

# Check for the token in environment variables (from Replit Secrets)
print_header "Checking for Firebase Token"
if [ -z "$FIREBASE_TOKEN" ]; then
  print_error "FIREBASE_TOKEN not found in environment variables"
  echo "Please add your Firebase token as a Replit Secret:"
  echo "1. Click on the padlock icon in the left sidebar"
  echo "2. Add a new secret with key 'FIREBASE_TOKEN' and your token as the value"
  echo "3. Run this script again"
  exit 1
else
  print_success "Firebase token found in environment variables"
fi

# Install firebase-tools if needed
print_header "Setting up Firebase Tools"
if ! npm list -g firebase-tools > /dev/null 2>&1; then
  echo "Installing firebase-tools..."
  npm install -g firebase-tools
  print_success "firebase-tools installed"
fi

# Build the application
print_header "Building the Application"
echo "Running npm run build..."
if npm run build; then
  print_success "Build completed successfully"
else
  print_error "Build failed"
  exit 1
fi

# Verify build output
if [ -d "./dist" ] && [ -d "./dist/public" ] && [ -f "./dist/public/index.html" ]; then
  print_success "Build output verified"
else
  print_error "Build output not found or incomplete"
  echo "Expected to find ./dist/public/index.html"
  exit 1
fi

# Deploy to Firebase
print_header "Deploying to Firebase Hosting"
echo "Using token from Replit Secrets..."

if firebase deploy --only hosting --token "$FIREBASE_TOKEN"; then
  print_header "Deployment Complete"
  print_success "Your application has been deployed to Firebase Hosting!"
  echo -e "\nYour site is now available at:"
  echo "  • https://trackedfr.web.app"
  echo "  • https://trackedfr.com (if DNS is configured)"
  echo "  • https://www.trackedfr.com (if DNS is configured)"
else
  print_error "Deployment failed"
  echo "Check the error messages above for more information"
  exit 1
fi

print_header "Final Steps"
print_warning "Important: Make sure to verify these settings in Firebase Console:"
echo "1. In Firebase Console > Authentication > Settings > Authorized domains:"
echo "   • trackedfr.com"
echo "   • www.trackedfr.com"
echo "2. Check that your DNS settings point to Firebase:"
echo "   • A record for trackedfr.com pointing to Firebase's IP addresses"
echo "   • CNAME for www.trackedfr.com pointing to trackedfr.firebaseapp.com"

print_header "Testing"
echo "Test your site at https://trackedfr.com to ensure:"
echo "1. Authentication works correctly"
echo "2. Domain transitions work properly"
echo "3. All features function as expected"