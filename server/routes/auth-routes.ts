
import { Router } from 'express';
import { authService } from '../services/auth-service';
import { AuthenticatedRequest, isAuthenticated } from '../middleware/auth-middleware';
import { storage } from '../storage';
import admin from 'firebase-admin';

const router = Router();

// Process login/signup based on Firebase authentication
router.post('/login', async (req, res) => {
  try {
    const { firebaseUser } = req.body;
    
    if (!firebaseUser || !firebaseUser.uid || !firebaseUser.email) {
      return res.status(400).json({ error: 'Invalid request. Missing user data.' });
    }
    
    const user = await authService.processUserLogin(firebaseUser);
    
    // Get email verification status from Firebase
    const firebaseUserRecord = await admin.auth().getUser(firebaseUser.uid);
    
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        surname: user.surname,
        company: user.company,
        emailVerified: firebaseUserRecord.emailVerified,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get current user info
router.get('/me', isAuthenticated, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    return res.status(200).json({
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      surname: req.user.surname,
      company: req.user.company,
      // Get email verification status directly from Firebase in the isAuthenticated middleware
      subscriptionStatus: req.user.subscriptionStatus,
      trialEndsAt: req.user.trialEndsAt,
      subscriptionEndsAt: req.user.subscriptionEndsAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to retrieve user information' });
  }
});

// GET user profile 
router.get('/users/profile', async (req, res) => {
  console.log("GET /api/auth/users/profile endpoint hit");
  try {
    const firebaseUid = req.headers["firebase-uid"];
    console.log("Firebase UID from headers:", firebaseUid);

    if (!firebaseUid || typeof firebaseUid !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User found:", user.id);
    res.json(user);
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH user profile
router.patch('/users/profile', async (req, res) => {
  console.log("PATCH /api/auth/users/profile endpoint hit");
  try {
    const firebaseUid = req.headers["firebase-uid"];
    console.log("Firebase UID from headers:", firebaseUid);
    console.log("Request body:", req.body);

    if (!firebaseUid || typeof firebaseUid !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User found, updating user:", user.id);
    const updatedUser = await storage.updateUser(user.id, req.body);
    res.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
