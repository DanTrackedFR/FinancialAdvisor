
import { Router } from 'express';
import { authService } from '../services/auth-service';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth-middleware';

const router = Router();

// Process login/signup based on Firebase authentication
router.post('/login', async (req, res) => {
  try {
    const { firebaseUser } = req.body;
    
    if (!firebaseUser || !firebaseUser.uid || !firebaseUser.email) {
      return res.status(400).json({ error: 'Invalid request. Missing user data.' });
    }
    
    const user = await authService.processUserLogin(firebaseUser);
    
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        surname: user.surname,
        company: user.company,
        emailVerified: user.emailVerified,
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
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
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
      emailVerified: req.user.emailVerified,
      subscriptionStatus: req.user.subscriptionStatus,
      trialEndsAt: req.user.trialEndsAt,
      subscriptionEndsAt: req.user.subscriptionEndsAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to retrieve user information' });
  }
});

export default router;
