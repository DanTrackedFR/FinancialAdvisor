
import { auth as firebaseAuth } from 'firebase-admin';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type User } from '@shared/schema';

/**
 * Service handling authentication operations
 */
export class AuthService {
  /**
   * Verify Firebase ID token and return user info
   */
  async verifyIdToken(idToken: string) {
    try {
      const decodedToken = await firebaseAuth().verifyIdToken(idToken);
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
      return result[0] || null;
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
  }): Promise<User> {
    try {
      const now = new Date();
      const trialEndsAt = new Date();
      trialEndsAt.setDate(now.getDate() + 14); // 14-day trial

      const newUser = {
        firebaseUid: userData.firebaseUid,
        email: userData.email,
        firstName: userData.firstName || '',
        surname: userData.surname || '',
        company: userData.company || '',
        emailVerified: userData.emailVerified,
        createdAt: now,
        updatedAt: now,
        subscriptionStatus: 'trial',
        trialEndsAt,
        lastLoginAt: now,
      };

      const result = await db.insert(users).values(newUser).returning();
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
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Process user login or create a new user if they don't exist
   */
  async processUserLogin(firebaseUser: { uid: string; email?: string; emailVerified?: boolean; displayName?: string }): Promise<User> {
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
          emailVerified: firebaseUser.emailVerified || false,
        });
        console.log('Created new user:', user.id);
      } else {
        // Update last login for existing user
        await this.updateLastLogin(user.id);
        console.log('User logged in:', user.id);
      }

      return user;
    } catch (error) {
      console.error('Error in processUserLogin:', error);
      throw new Error('Failed to process user login');
    }
  }
}

export const authService = new AuthService();
