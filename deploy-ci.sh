#!/bin/bash

# TrackedFR Firebase CI Deployment Script
# This script is designed for continuous integration and automated deployment
# It runs in non-interactive mode and provides detailed output for CI logs

# Set strict mode
set -e

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# Functions
log_info() {
  echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check environment variables
check_env_variables() {
  log_info "Checking required environment variables..."
  
  if [ -z "$FIREBASE_SERVICE_ACCOUNT" ]; then
    log_error "FIREBASE_SERVICE_ACCOUNT is not set. This is required for CI deployment."
    log_info "Please set this environment variable in your CI environment."
    exit 1
  fi
  
  if [ -z "$FIREBASE_PROJECT_ID" ]; then
    log_warning "FIREBASE_PROJECT_ID is not set. Using default from .firebaserc"
  else
    log_info "Using FIREBASE_PROJECT_ID: $FIREBASE_PROJECT_ID"
    # Update .firebaserc with the provided project ID
    create_firebaserc
  fi
  
  log_success "Environment variables check completed."
}

# Create or update Firebase configuration files
create_firebase_config() {
  log_info "Setting up Firebase configuration files..."
  
  # Create firebase.json if it doesn't exist
  if [ ! -f "firebase.json" ]; then
    log_info "Creating firebase.json..."
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
    log_success "firebase.json created."
  else
    log_info "firebase.json already exists."
  fi
  
  create_firebaserc
  
  log_success "Firebase configuration setup completed."
}

create_firebaserc() {
  # Create or update .firebaserc
  PROJECT_ID=${FIREBASE_PROJECT_ID:-"trackedfr"}
  
  log_info "Setting up .firebaserc with project: $PROJECT_ID"
  cat > .firebaserc << EOL
{
  "projects": {
    "default": "$PROJECT_ID"
  }
}
EOL
  log_success ".firebaserc created/updated."
}

# Build the application
build_app() {
  log_info "Building the application..."
  
  # Check if BUILD_COMMAND is set, otherwise use default
  BUILD_CMD=${BUILD_COMMAND:-"npm run build"}
  
  log_info "Running build command: $BUILD_CMD"
  eval $BUILD_CMD
  
  # Check if build was successful
  if [ ! -d "dist/public" ]; then
    log_error "Build failed: dist/public directory not found."
    exit 1
  fi
  
  log_success "Build completed successfully."
}

# Deploy to Firebase
deploy() {
  log_info "Preparing for Firebase deployment..."
  
  # Create service account file
  log_info "Creating temporary service account file..."
  echo "$FIREBASE_SERVICE_ACCOUNT" > firebase-service-account.json
  
  # Set environment variable for Firebase authentication
  export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/firebase-service-account.json"
  
  # Ensure firebase-tools is installed
  log_info "Ensuring firebase-tools is installed..."
  # In GitHub Actions, we may need sudo for global install
  if [ "$CI" = "true" ]; then
    sudo npm install -g firebase-tools
  else
    npm install -g firebase-tools
  fi
  
  # Run deployment
  log_info "Deploying to Firebase Hosting..."
  
  if [ "$CI_DEBUG" = "true" ]; then
    log_info "Running in debug mode - extra verbosity enabled"
    firebase deploy --only hosting --json
  else
    firebase deploy --only hosting
  fi
  
  # Check deployment status
  DEPLOY_STATUS=$?
  
  # Clean up service account file
  log_info "Cleaning up temporary files..."
  rm firebase-service-account.json
  
  # Output results
  if [ $DEPLOY_STATUS -eq 0 ]; then
    log_success "Deployment completed successfully!"
    log_info "Site is now live at:"
    echo -e "${BOLD}https://trackedfr.com${NC}"
    echo -e "${BOLD}https://trackedfr.web.app${NC}"
    return 0
  else
    log_error "Deployment failed with status code: $DEPLOY_STATUS"
    return 1
  fi
}

# Create deployment summary
create_deployment_summary() {
  log_info "Creating deployment summary..."
  
  # Get current timestamp
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
  
  # Create a summary file (useful for CI/CD logs)
  cat > deployment-summary.json << EOL
{
  "timestamp": "$TIMESTAMP",
  "project": "${FIREBASE_PROJECT_ID:-"trackedfr"}",
  "status": "$1",
  "urls": [
    "https://trackedfr.com",
    "https://trackedfr.web.app"
  ],
  "environment": "$([ -z "$CI" ] && echo "manual" || echo "ci")"
}
EOL
  
  log_success "Deployment summary created: deployment-summary.json"
  cat deployment-summary.json
}

# Main execution
main() {
  echo -e "${BOLD}TrackedFR CI Deployment Script${NC}"
  echo "Starting deployment process at $(date)"
  echo "--------------------------------------------"
  
  # Check for skip flags
  if [ "$SKIP_ENV_CHECK" != "true" ]; then
    check_env_variables
  fi
  
  if [ "$SKIP_CONFIG" != "true" ]; then
    create_firebase_config
  fi
  
  if [ "$SKIP_BUILD" != "true" ]; then
    build_app
  else
    log_info "Build step skipped due to SKIP_BUILD=true"
  fi
  
  # Deploy
  deploy
  DEPLOY_RESULT=$?
  
  # Create summary
  if [ $DEPLOY_RESULT -eq 0 ]; then
    create_deployment_summary "success"
    log_success "Deployment process completed successfully."
    exit 0
  else
    create_deployment_summary "failed"
    log_error "Deployment process failed."
    exit 1
  fi
}

# Execute main function
main