# TrackedFR Deployment Guide

This document provides comprehensive instructions for deploying the TrackedFR application to Firebase Hosting. Multiple deployment options are available to accommodate different user preferences and workflow requirements.

## Prerequisites

Before deploying, ensure you have:

1. **Firebase Project Setup**:
   - A Firebase project created at [Firebase Console](https://console.firebase.google.com)
   - Firebase configuration added to your environment variables
   - Firebase service account credentials (for automated deployments)

2. **Domain Configuration**:
   - Custom domain added in Firebase Hosting settings
   - DNS configuration updated to point to Firebase hosting

3. **Build Process**:
   - Application successfully builds with `npm run build`
   - Build output generates `dist/public` directory

## Deployment Options

### Option 1: Manual Upload via Firebase Console (Beginner-Friendly)

This option requires no command-line knowledge and is ideal for non-technical team members.

1. Prepare the deployment package:
   ```
   node prepare-manual-upload.js
   ```

2. Follow the on-screen instructions to:
   - Upload the generated ZIP file to Firebase Console
   - Complete the deployment through the web interface

### Option 2: Firebase CLI Deployment (Standard)

This option uses the Firebase CLI for a traditional deployment workflow.

1. Install the Firebase CLI globally:
   ```
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```
   firebase login
   ```

3. Build and deploy:
   ```
   npm run build
   firebase deploy --only hosting
   ```

### Option 3: Automatic Deployment with Service Account (Advanced)

This option allows deployment without interactive login, useful for CI/CD pipelines or deployments from environments where browser login isn't possible.

1. Ensure the `FIREBASE_SERVICE_ACCOUNT` environment variable is set with the service account JSON.

2. Run one of the following deployment scripts:
   
   **JavaScript deployment script (with detailed output):**
   ```
   node firebase-deploy-script.js
   ```
   
   **Bash deployment script (simple and reliable):**
   ```
   bash deploy-with-token.sh
   ```

### Option 4: CI/CD Deployment with GitHub Actions

This option automates deployments when changes are pushed to your GitHub repository.

1. Add the Firebase service account as a GitHub repository secret named `FIREBASE_SERVICE_ACCOUNT`.

2. The included `.github/workflows/firebase-deploy.yml` will:
   - Trigger on pushes to the main branch
   - Build and deploy the application automatically
   - Generate deployment reports as artifacts

## Troubleshooting

If you encounter deployment issues:

1. **Verify Firebase Configuration**:
   ```
   node server/check-firebase-env.js
   ```

2. **Check Environment Variables**:
   Ensure all required Firebase configuration variables are set.

3. **Verify Build Output**:
   Confirm that `dist/public` contains a valid `index.html` and all required assets.

4. **Common Firebase Errors**:
   - "Unauthorized domain": Ensure your domain is added to Firebase Authentication authorized domains.
   - "Permission denied": Verify that your service account has the necessary permissions.

## Environment Variables

For proper deployment, ensure these environment variables are set:

### Client-Side Variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN` (should be `trackedfr.com` for production)
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Server-Side Variables:
- `FIREBASE_SERVICE_ACCOUNT` (for automated deployments)

## DNS Configuration

For custom domain setup:

1. **A Record for Root Domain**:
   - Type: A
   - Name: @
   - Values: Firebase Hosting IPs (provided in Firebase Console)

2. **CNAME for www Subdomain**:
   - Type: CNAME
   - Name: www
   - Value: trackedfr.firebaseapp.com

## Security Best Practices

1. Never commit Firebase service account keys to your repository.
2. Use environment secrets in CI/CD platforms.
3. Set up IP allowlisting for your Firebase project if applicable.
4. Regularly rotate service account keys.

## Contact and Support

For deployment assistance or troubleshooting, contact the TrackedFR DevOps team at devops@trackedfr.com.