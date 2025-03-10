
import { Router } from 'express';
import { authService } from '../services/auth-service';
import { AuthenticatedRequest, isAuthenticated } from '../middleware/auth-middleware';
import { storage } from '../storage';
import admin from 'firebase-admin';
import z from 'zod';

const router = Router();

// Process login/signup based on Firebase authentication
router.post('/login', async (req, res) => {
  try {
    const { firebaseUser } = req.body;
    
    if (!firebaseUser || !firebaseUser.uid || !firebaseUser.email) {
      return res.status(400).json({ error: 'Invalid request. Missing user data.' });
    }
    
    console.log('Login request with firebaseUser:', { 
      uid: firebaseUser.uid, 
      email: firebaseUser.email, 
      hasCompany: !!firebaseUser.company 
    });
    
    const user = await authService.processUserLogin(firebaseUser);
    
    // Get email verification status from Firebase
    const firebaseUserRecord = await admin.auth().getUser(firebaseUser.uid);
    
    // For security purposes, log admin logins separately
    if (user.isAdmin) {
      console.log(`ADMIN LOGIN: User ${user.email} (ID: ${user.id}) authenticated with admin privileges`);
    }
    
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
        isAdmin: user.isAdmin || false, // Include admin status
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
    
    // Include email verification status from the req.firebaseUser if available
    const emailVerified = req.firebaseUser?.emailVerified || true; // Default to true if not available
    
    return res.status(200).json({
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      surname: req.user.surname,
      company: req.user.company,
      emailVerified: emailVerified,
      subscriptionStatus: req.user.subscriptionStatus,
      trialEndsAt: req.user.trialEndsAt,
      subscriptionEndsAt: req.user.subscriptionEndsAt,
      isAdmin: req.user.isAdmin || false, // Include admin status
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

// DELETE user account
// Admin status verification endpoint
router.get('/admin-status', isAuthenticated, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Return only the admin status without exposing other user data
    return res.status(200).json({
      isAdmin: req.user.isAdmin || false,
    });
  } catch (error) {
    console.error('Admin status check error:', error);
    return res.status(500).json({ error: 'Failed to verify admin status' });
  }
});

router.delete('/account', isAuthenticated, async (req: AuthenticatedRequest, res) => {
  console.log("DELETE /api/auth/account endpoint hit");
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    const firebaseUid = req.user.firebaseUid;
    
    if (!userId || !firebaseUid) {
      return res.status(400).json({ error: 'Invalid user data' });
    }
    
    console.log(`Deleting user account: ${userId} (Firebase UID: ${firebaseUid})`);
    
    try {
      // First delete the user from the database
      await storage.deleteUser(userId);
      
      // Then delete the Firebase user
      await admin.auth().deleteUser(firebaseUid);
      
      console.log(`User account deleted successfully: ${userId}`);
      return res.status(200).json({ success: true });
    } catch (deleteError: any) {
      console.error('Error during account deletion:', deleteError);
      return res.status(500).json({ error: 'Failed to delete account', details: deleteError.message });
    }
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return res.status(500).json({ error: 'Failed to process account deletion request' });
  }
});

export default router;
