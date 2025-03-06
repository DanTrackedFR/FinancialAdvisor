import { Request, Response, NextFunction } from "express";
import admin from "../lib/firebase-admin";
import { storage } from "../storage";

export interface AuthenticatedRequest extends Request {
  user?: any;
  firebaseUser?: any;
}

/**
 * Middleware to check if a user is authenticated
 * Verifies the Firebase JWT token from the Authorization header
 * and falls back to the firebase-uid header if needed
 */
export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    // Try to get the Authorization header first (preferred method)
    const authHeader = req.headers.authorization;
    let firebaseUid: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      
      try {
        // Verify the Firebase token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        firebaseUid = decodedToken.uid;
        console.log("User authenticated via ID token:", firebaseUid);
      } catch (tokenError) {
        console.error("Token verification failed:", tokenError);
        // Continue to try the firebase-uid header as fallback
      }
    }
    
    // If token verification failed, try the firebase-uid header as fallback
    if (!firebaseUid) {
      firebaseUid = req.headers["firebase-uid"] as string;
      console.log("Falling back to firebase-uid header:", firebaseUid);
    }

    if (!firebaseUid) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "Authentication required to access this resource"
      });
    }

    // Verify the Firebase UID exists
    const userRecord = await admin.auth().getUser(firebaseUid);

    if (!userRecord.emailVerified) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Email verification required"
      });
    }

    // Get the user from our database
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found in database"
      });
    }

    // Attach user to request for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in authentication middleware:", error);
    return res.status(401).json({ 
      error: "Unauthorized", 
      message: "Invalid authentication credentials"
    });
  }
}

/**
 * Middleware to check if email is verified
 */
export const requireEmailVerification = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({ error: 'Email verification required' });
  }

  next();
};