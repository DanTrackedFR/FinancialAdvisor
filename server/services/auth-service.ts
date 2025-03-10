
import admin from 'firebase-admin';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { type User, users } from '@shared/schema';

/**
 * Service handling authentication operations
 */
export class AuthService {
  /**
   * Verify Firebase ID token and return user info
   */
  async verifyIdToken(idToken: string) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      throw new Error('Invalid authentication token');
    }
  }

  /**
   * Get user by Firebase UID
   */
  async getUserByFirebaseId(firebaseUid: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
      
      // Check if we found a user
      if (result.length === 0) {
        return null;
      }
      
      // Add some debug logging for the admin status
      const user = result[0];
      if (user.isAdmin) {
        console.log(`User ${user.email} has admin privileges`);
      }
      
      return user;
    } catch (error) {
      console.error('Error fetching user by Firebase UID:', error);
      throw new Error('Database error when fetching user');
    }
  }

  /**
   * Create a new user in the database
   */
  async createUser(userData: {
    firebaseUid: string;
    email: string;
    firstName?: string;
    surname?: string;
    company?: string;
    emailVerified: boolean;
    isAdmin?: boolean;
  }): Promise<User> {
    try {
      const now = new Date();
      const trialEndsAt = new Date();
      trialEndsAt.setDate(now.getDate() + 14); // 14-day trial

      // Check for specific admin domains or email patterns that should get admin access
      // This is just an example - you can customize this logic based on your requirements
      const isAdminEmail = 
        userData.isAdmin === true || // If explicitly set to true
        userData.email.endsWith('@trackedfr.com') || // Company domain
        userData.email === 'danhastings06@gmail.com'; // Specific admin email

      const newUser = {
        firebaseUid: userData.firebaseUid,
        email: userData.email,
        firstName: userData.firstName || '',
        surname: userData.surname || '',
        company: userData.company || null,
        subscriptionStatus: 'trial' as const,
        trialEndsAt,
        createdAt: now,
        isAdmin: isAdminEmail, // Set admin status based on email
      };

      if (newUser.isAdmin) {
        console.log(`Creating user with admin privileges: ${userData.email}`);
      }

      const result = await db.insert(users).values([newUser]).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user in database');
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: number): Promise<void> {
    try {
      await db.update(users)
        .set({ lastLoggedIn: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Check if a user is attempting to access admin areas
   * This helps with additional security logging
   */
  async checkAdminAccessAttempt(userId: number, email: string, isAdmin: boolean) {
    const now = new Date();
    const timestamp = now.toISOString();
    
    // Log all admin access attempts (successful or not)
    console.log(`[AUTH EVENT] [${timestamp}] User ID: ${userId}, Email: ${email}, Admin Access: ${isAdmin ? 'GRANTED' : 'DENIED'}`);
    
    // For non-admin users attempting to access admin areas, we can implement
    // additional security measures like rate limiting or alerting in the future
    if (!isAdmin) {
      console.warn(`[SECURITY WARNING] [${timestamp}] Possible unauthorized admin access attempt by User ID: ${userId}, Email: ${email}`);
      // Here we could implement additional security measures like
      // - Rate limiting for failed admin attempts
      // - Notifying administrators
      // - Temporarily locking the account
    }
  }

  /**
   * Process user login or create a new user if they don't exist
   */
  async processUserLogin(firebaseUser: { uid: string; email?: string; emailVerified?: boolean; displayName?: string; company?: string }): Promise<User> {
    if (!firebaseUser.email) {
      throw new Error('User email is required');
    }

    try {
      // Check if user exists in our database
      let user = await this.getUserByFirebaseId(firebaseUser.uid);

      if (!user) {
        // If user doesn't exist, create a new one
        const nameParts = (firebaseUser.displayName || '').split(' ');
        const firstName = nameParts[0] || '';
        const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        user = await this.createUser({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          firstName,
          surname,
          company: firebaseUser.company,
          emailVerified: firebaseUser.emailVerified || false,
        });
        console.log('Created new user:', user.id);
      } else {
        // Update last login for existing user
        await this.updateLastLogin(user.id);
        
        // Add specialized admin login logging
        if (user.isAdmin) {
          console.log(`Admin user logged in: ${user.email} (ID: ${user.id})`);
        } else {
          console.log('User logged in:', user.id);
        }
      }

      return user;
    } catch (error) {
      console.error('Error in processUserLogin:', error);
      throw new Error('Failed to process user login');
    }
  }
}

export const authService = new AuthService();
