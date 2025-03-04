
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth-service';

export interface AuthenticatedRequest extends Request {
  user?: any;
  firebaseUser?: any;
}

/**
 * Middleware to verify Firebase authentication token
 */
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const firebaseUid = req.headers['firebase-uid'] as string;

  try {
    // Check for Firebase UID in header (current method)
    if (firebaseUid) {
      const user = await authService.getUserByFirebaseId(firebaseUid);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.user = user;
      return next();
    }

    // Check for Bearer token (standard method)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      if (!idToken) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decodedToken = await authService.verifyIdToken(idToken);
      const user = await authService.getUserByFirebaseId(decodedToken.uid);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.firebaseUser = decodedToken;
      req.user = user;
      return next();
    }

    return res.status(401).json({ error: 'Authentication required' });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

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
