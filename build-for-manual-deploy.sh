#!/bin/bash

# Build script for manual Firebase deployment
# ------------------------------------------------------

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions for output formatting
print_header() { echo -e "\n${BLUE}===== $1 =====${NC}\n"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

print_header "Building for Firebase Manual Deployment"

# Building the application
print_header "Building the application"
echo "Running npm run build..."
if npm run build; then
  print_success "Build completed successfully."
else
  print_error "Build failed."
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

# Create a ZIP file for easy downloading
print_header "Creating deployment package"
cd dist/public
zip -r ../../firebase-deploy.zip .
cd ../..

if [ -f "./firebase-deploy.zip" ]; then
  print_success "Deployment package created: firebase-deploy.zip"
  echo "File size: $(du -h firebase-deploy.zip | cut -f1)"
else
  print_error "Failed to create deployment package."
  exit 1
fi

print_header "Manual Deployment Instructions"

echo -e "1. ${YELLOW}Download the deployment package:${NC}"
echo "   • Download the file: ./firebase-deploy.zip"
echo "   • In Replit, right-click on the file in the file browser and select 'Download'"
echo ""

echo -e "2. ${YELLOW}Go to Firebase Console:${NC}"
echo "   • Visit: https://console.firebase.google.com/project/trackedfr/hosting/sites"
echo "   • Navigate to: Hosting > trackedfr"
echo ""

echo -e "3. ${YELLOW}Upload files:${NC}"
echo "   • In Firebase Console, click 'Upload files'"
echo "   • Extract the content from firebase-deploy.zip on your computer"
echo "   • Select all files from the extracted folder and upload them"
echo ""

echo -e "4. ${YELLOW}Verify domain configuration:${NC}"
echo "   • In Firebase Console, go to Authentication > Settings > Authorized domains"
echo "   • Make sure both trackedfr.com and www.trackedfr.com are listed"
echo "   • If not, add them by clicking 'Add domain'"
echo ""

echo -e "5. ${YELLOW}Update Authentication domain in your environment variables:${NC}"
echo "   • Make sure VITE_FIREBASE_AUTH_DOMAIN is set to 'trackedfr.com'"
echo ""

echo -e "6. ${YELLOW}Verify deployment:${NC}"
echo "   • Visit your site at https://trackedfr.com"
echo "   • Test authentication functionality"
echo ""

print_warning "Important DNS Configuration:"
echo "• A record for trackedfr.com pointing to Firebase's IP addresses"
echo "• CNAME for www.trackedfr.com pointing to trackedfr.firebaseapp.com"