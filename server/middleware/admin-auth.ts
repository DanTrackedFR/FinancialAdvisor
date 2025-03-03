import express from 'express';
import { storage } from '../storage';

// Admin emails list - should be kept in sync with client-side
const ADMIN_EMAILS = [
  'admin@trackedfr.com',
  'support@trackedfr.com'
  // Add other admin emails here
];

/**
 * Middleware to check if the user is an admin
 * Verifies the Firebase UID from the request headers and
 * checks if the user's email is in the admin list
 */
export async function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const firebaseUid = req.headers['firebase-uid'] as string;

  // No Firebase UID provided
  if (!firebaseUid) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required to access this resource'
    });
  }

  try {
    // Get user from database by Firebase UID
    const user = await storage.getUserByFirebaseUid(firebaseUid);

    // No user found with that Firebase UID
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not found'
      });
    }

    // User exists but is not an admin
    if (!ADMIN_EMAILS.includes(user.email)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Admin access required to perform this action'
      });
    }

    // User is authenticated and has admin privileges
    // Attach user to the request for use in subsequent middleware/routes
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in admin authentication middleware:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to verify admin status'
    });
  }
}
