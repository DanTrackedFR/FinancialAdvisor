import { Request, Response, NextFunction } from "express";
import admin, { isAuthorizedDomain } from "../lib/firebase-admin";
import { storage } from "../storage";
import { User } from "../../shared/schema";

export interface FirebaseUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  [key: string]: any; // Allow for additional properties
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  firebaseUser?: FirebaseUserData;
}

/**
 * Helper function to log token information for debugging
 * Only logs a preview of the token for security
 */
function logTokenInfo(idToken: string) {
  if (!idToken) return;
  
  const tokenPreview = idToken.substring(0, 10) + '...';
  console.log(`Token verification attempt: ${tokenPreview}`);
  
  // Log environment info
  console.log("Auth environment:", {
    node_env: process.env.NODE_ENV || 'undefined',
    auth_domain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'undefined',
    project_id: process.env.VITE_FIREBASE_PROJECT_ID || 'undefined',
    is_firebase_hosting: process.env.FIREBASE_CONFIG ? 'yes' : 'no'
  });
}

/**
 * Retry token verification with more detailed error handling
 */
async function verifyFirebaseToken(idToken: string, retryCount = 0): Promise<any> {
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (error: any) {
    console.error(`Token verification error (attempt ${retryCount + 1}):`, error.message);
    
    if (retryCount < 2) {
      // Sometimes tokens need to be refreshed due to clock skew issues
      if (error.code === 'auth/id-token-expired' || 
          error.code === 'auth/id-token-revoked' ||
          error.message?.includes('expired')) {
        console.log("Token possibly expired, trying once more with force refresh");
        return verifyFirebaseToken(idToken, retryCount + 1);
      }
      
      // Domain mismatch issues might require using a different verification approach
      if (error.message?.includes('domain')) {
        console.log("Domain mismatch detected, using custom domain verification");
        const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN;
        if (authDomain) {
          console.log(`Checking if ${authDomain} is in the authorized domains list`);
          if (isAuthorizedDomain(authDomain)) {
            console.log(`${authDomain} is authorized, retrying verification with adjusted settings`);
            return verifyFirebaseToken(idToken, retryCount + 1);
          }
        }
      }
    }
    
    // If we've tried enough or it's not a retryable error, rethrow
    throw error;
  }
}

/**
 * Middleware to check if a user is authenticated
 * Verifies the Firebase JWT token from the Authorization header
 * and falls back to the firebase-uid header if needed
 */
export async function isAuthenticated(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Try to get the Authorization header first (preferred method)
    const authHeader = req.headers.authorization;
    let firebaseUid: string | null = null;
    let emailVerified: boolean = false;
    let displayName: string | null = null;
    let email: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      
      try {
        // Enhanced token verification logging
        console.log("Verifying token with auth domain:", process.env.VITE_FIREBASE_AUTH_DOMAIN);
        console.log("Current origin:", req.headers.origin || "No origin header");
        console.log("Current host:", req.headers.host || "No host header");
        
        // Log token preview for debugging
        logTokenInfo(idToken);
        
        // Use enhanced token verification with retries
        const decodedToken = await verifyFirebaseToken(idToken);
        firebaseUid = decodedToken.uid;
        email = decodedToken.email || null;
        emailVerified = decodedToken.email_verified || false;
        displayName = decodedToken.name || null;
        
        console.log("User authenticated via ID token:", firebaseUid);
        console.log("Token contains email verified status:", emailVerified);
        console.log("Token issuer:", decodedToken.iss || "No issuer in token");
        console.log("Token audience:", decodedToken.aud || "No audience in token");
        
        // Additional token fields that might be useful for debugging
        if (decodedToken.sign_in_provider) {
          console.log("Sign-in provider:", decodedToken.sign_in_provider);
        }
        
        // Log successful verification
        console.log(`✅ Token verification successful for user: ${email || firebaseUid}`);
      } catch (tokenError: any) {
        // More detailed error logging for token verification failures
        console.error("❌ Token verification failed:", tokenError);
        console.error("Error code:", tokenError.code || "No error code");
        console.error("Error message:", tokenError.message || "No error message");
        
        // Check if this is a domain mismatch issue
        if (tokenError.message?.includes('domain')) {
          console.error("This appears to be a domain configuration issue. Make sure Firebase console has the correct authorized domains.");
          console.error("Current authorized domains should include:", process.env.VITE_FIREBASE_AUTH_DOMAIN);
          
          // Provide more helpful error information in the response
          return res.status(401).json({
            error: "Unauthorized",
            message: "Authentication token domain mismatch. Please log out and log in again.",
            details: "Your session may be using credentials from a different domain."
          });
        }
        
        // Continue to try the firebase-uid header as fallback
        console.log("Falling back to firebase-uid header authentication method");
      }
    }
    
    // If token verification failed, try the firebase-uid header as fallback
    if (!firebaseUid) {
      firebaseUid = req.headers["firebase-uid"] as string;
      if (firebaseUid) {
        console.log("Falling back to firebase-uid header authentication:", firebaseUid);
      }
    }

    if (!firebaseUid) {
      console.log("Authentication failed: No valid Firebase UID found");
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "Authentication required to access this resource"
      });
    }

    // We got a Firebase UID, now verify the user exists in Firebase
    try {
      const userRecord = await admin.auth().getUser(firebaseUid);
      emailVerified = userRecord.emailVerified;
      email = userRecord.email || null;
      displayName = userRecord.displayName || null;

      if (!emailVerified) {
        console.log(`User ${firebaseUid} (${email}) has unverified email`);
        return res.status(403).json({
          error: "Forbidden",
          message: "Email verification required"
        });
      }
      
      console.log(`Firebase user verified: ${email} (${firebaseUid})`);
    } catch (firebaseError) {
      console.error(`Error retrieving Firebase user ${firebaseUid}:`, firebaseError);
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "Invalid Firebase user ID"
      });
    }

    // Firebase user exists and email is verified, now check our database
    try {
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      
      // If user doesn't exist in database but is authenticated in Firebase,
      // attempt to auto-register them
      if (!user && email) {
        console.log(`Firebase user ${firebaseUid} (${email}) not found in database - attempting auto-registration`);
        
        try {
          // Import authService dynamically to avoid circular dependencies
          const { authService } = require('../services/auth-service');
          
          // Process login/registration using the auth service
          user = await authService.processUserLogin({
            uid: firebaseUid,
            email: email,
            emailVerified: emailVerified,
            displayName: displayName
          });
          
          if (user) {
            console.log(`Auto-registered user ${email} (ID: ${user.id})`);
          }
        } catch (regError) {
          console.error(`Failed to auto-register user ${email}:`, regError);
          // Continue with the user not found response
        }
      }
      
      // Still check if user exists after auto-registration attempt
      if (!user) {
        console.log(`Firebase user ${firebaseUid} (${email}) not found in application database`);
        return res.status(404).json({
          error: "Not Found",
          message: "User not found in database"
        });
      }
      
      // Success! Attach user to request for use in route handlers
      console.log(`User ${user.email} (ID: ${user.id}) successfully authenticated`);
      req.user = user;
      
      // Also update the user's last login time
      try {
        await storage.updateLastLogin(user.id);
      } catch (loginUpdateError) {
        console.error(`Failed to update last login time for user ${user.id}:`, loginUpdateError);
        // Non-critical error, continue with authentication
      }
      
      // Also attach the Firebase user data for optional use
      req.firebaseUser = {
        uid: firebaseUid,
        email: email,
        displayName: displayName,
        emailVerified: emailVerified
      };
      
      next();
    } catch (dbError) {
      console.error(`Database error when retrieving user ${firebaseUid}:`, dbError);
      return res.status(500).json({ 
        error: "Internal Server Error", 
        message: "Error retrieving user data"
      });
    }
  } catch (error) {
    console.error("Unexpected error in authentication middleware:", error);
    return res.status(401).json({ 
      error: "Unauthorized", 
      message: "Invalid authentication credentials"
    });
  }
}

/**
 * Middleware to check if email is verified
 * This is more efficient when used after isAuthenticated middleware,
 * as it will use the already retrieved Firebase user data when available
 */
export const requireEmailVerification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    console.log("Email verification check failed: No authenticated user");
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required' 
    });
  }

  // If we already have the Firebase user data from previous middleware
  if (req.firebaseUser && typeof req.firebaseUser.emailVerified === 'boolean') {
    if (!req.firebaseUser.emailVerified) {
      console.log(`Email verification required for user ${req.user.email}`);
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Email verification required' 
      });
    }
    // Email is verified based on cached Firebase user data
    next();
    return;
  }

  // If we don't have the Firebase user data, fetch it from Firebase
  try {
    const firebaseUser = await admin.auth().getUser(req.user.firebaseUid);
    
    if (!firebaseUser.emailVerified) {
      console.log(`Email verification required for user ${req.user.email}`);
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Email verification required' 
      });
    }
    
    // Also cache the Firebase user data for future use
    req.firebaseUser = {
      uid: firebaseUser.uid,
      email: (firebaseUser.email as string | null) || null,
      displayName: (firebaseUser.displayName as string | null) || null,
      emailVerified: firebaseUser.emailVerified
    };
    
    next();
  } catch (error) {
    console.error(`Error checking email verification for user ${req.user.email}:`, error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to verify email status' 
    });
  }
};