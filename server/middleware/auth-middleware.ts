import { Request, Response, NextFunction } from "express";
import admin from "../lib/firebase-admin";
import { storage } from "../storage";

export interface AuthenticatedRequest extends Request {
  user?: any;
  firebaseUser?: any;
}

/**
 * Middleware to check if a user is authenticated
 * Verifies the Firebase UID from the request headers
 */
export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const firebaseUid = req.headers["firebase-uid"] as string;

  if (!firebaseUid) {
    return res.status(401).json({ 
      error: "Unauthorized", 
      message: "Authentication required to access this resource"
    });
  }

  try {
    // Verify the Firebase UID
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