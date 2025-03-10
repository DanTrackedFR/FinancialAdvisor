import { Request, Response, NextFunction } from "express";
import admin from "../lib/firebase-admin";
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
        // Verify the Firebase token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        firebaseUid = decodedToken.uid;
        email = decodedToken.email || null;
        emailVerified = decodedToken.email_verified || false;
        displayName = decodedToken.name || null;
        
        console.log("User authenticated via ID token:", firebaseUid);
        console.log("Token contains email verified status:", emailVerified);
      } catch (tokenError) {
        console.error("Token verification failed:", tokenError);
        // Continue to try the firebase-uid header as fallback
      }
    }
    
    // If token verification failed, try the firebase-uid header as fallback
    if (!firebaseUid) {
      firebaseUid = req.headers["firebase-uid"] as string;
      if (firebaseUid) {
        console.log("Falling back to firebase-uid header:", firebaseUid);
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
          
          console.log(`Auto-registered user ${email} (ID: ${user.id})`);
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
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
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