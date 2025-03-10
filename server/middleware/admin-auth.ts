import express from 'express';
import { AuthenticatedRequest } from './auth-middleware';
import { storage } from '../storage';
import { User } from '../../shared/schema';
import admin from 'firebase-admin';

/**
 * Middleware to check if the user is an admin
 * Verifies the Firebase user via JWT token in Authorization header
 * or Firebase UID in firebase-uid header, then checks admin privileges
 */
export async function isAdmin(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  let firebaseUid: string | null = null;
  
  // First check if the user is already set from a previous middleware
  if (req.user) {
    firebaseUid = req.user.firebaseUid;
  } 
  // If not, try to get from firebase-uid header
  else if (req.headers['firebase-uid']) {
    firebaseUid = req.headers['firebase-uid'] as string;
  } 
  // Finally try to get from Authorization Bearer token
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const idToken = req.headers.authorization.split('Bearer ')[1];
    
    try {
      // Verify the token with Firebase
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      firebaseUid = decodedToken.uid;
      
      // Log successful token verification
      console.log(`Admin check: Token verified for UID ${firebaseUid}`);
    } catch (error) {
      console.error('Invalid ID token in Authorization header:', error);
    }
  }

  // No valid Firebase UID found
  if (!firebaseUid) {
    console.log('Admin auth failed: No valid Firebase UID found');
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
      console.log(`Admin auth failed: No user found for UID ${firebaseUid}`);
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not found'
      });
    }

    // Use the security check function to log and handle admin access attempts
    const { authService } = await import('../services/auth-service');
    
    // Whether user has admin status or not, log the access attempt for security auditing
    await authService.checkAdminAccessAttempt(user.id, user.email, !!user.isAdmin);
    
    // User exists but is not an admin
    if (!user.isAdmin) {
      console.log(`Admin auth failed: User ${firebaseUid} (${user.email}) is not an admin`);
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Admin access required to perform this action'
      });
    }

    console.log(`Admin auth success: User ${user.email} authenticated as admin`);
    
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