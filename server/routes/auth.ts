import { Router } from "express";
import { storage } from "../storage";
import { createCustomer, createCheckoutSession } from "../services/stripe";
import { insertUserSchema } from "@shared/schema";
import { isAdmin } from "../middleware/admin-auth";

const router = Router();

router.post("/users", async (req, res) => {
  try {
    const firebaseUid = req.headers["firebase-uid"];
    if (!firebaseUid || typeof firebaseUid !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userData = insertUserSchema.parse(req.body);

    // Create user in database
    const user = await storage.createUser({
      ...userData,
      firebaseUid,
    });

    // Create Stripe customer and start trial
    await createCustomer(
      user.id,
      userData.email,
      `${userData.firstName} ${userData.surname}`
    );

    res.json(user);
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(400).json({ error: error.message });
  }
});

// Added explicit console logs for debugging the profile endpoint
router.get("/users/profile", async (req, res) => {
  console.log("GET /api/users/profile endpoint hit");
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

// Added explicit console logs for debugging the profile update endpoint
router.patch("/users/profile", async (req, res) => {
  console.log("PATCH /api/users/profile endpoint hit");
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

// New endpoint to update a user's Firebase UID by email
router.post("/users/update-firebase-uid", async (req, res) => {
  console.log("POST /api/users/update-firebase-uid endpoint hit");
  try {
    const { email, firebaseUid } = req.body;
    console.log("Request to update Firebase UID:", { email, firebaseUid });

    if (!email || !firebaseUid) {
      return res.status(400).json({ error: "Email and Firebase UID are required" });
    }

    // Find the user by email
    const users = await storage.getAllUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.error(`User not found with email: ${email}`);
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`Updating Firebase UID for user ${user.id} (${user.email}) from ${user.firebaseUid} to ${firebaseUid}`);

    // Update the Firebase UID with the correct column name in the database
    // Changed from { firebaseUid } to { firebase_uid: firebaseUid } to match database column name
    const updatedUser = await storage.updateUser(user.id, { firebase_uid: firebaseUid });

    console.log("Update successful:", { id: updatedUser.id, firebaseUid: updatedUser.firebaseUid });

    res.json({ 
      success: true, 
      message: "Firebase UID updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firebaseUid: updatedUser.firebaseUid
      }
    });
  } catch (error: any) {
    console.error("Error updating Firebase UID:", error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to set admin status (admin-only)
router.patch("/users/:id/admin-status", isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { isAdmin } = req.body;

    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: "isAdmin must be a boolean value" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update admin status
    const updatedUser = await storage.updateUser(userId, { isAdmin });
    res.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating admin status:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/subscriptions/manage", async (req, res) => {
  try {
    const firebaseUid = req.headers["firebase-uid"];
    if (!firebaseUid || typeof firebaseUid !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.stripeCustomerId) {
      // Create a new customer if they don't have one
      const customer = await createCustomer(
        user.id,
        user.email,
        `${user.firstName} ${user.surname}`
      );
      await storage.updateStripeCustomerId(user.id, customer.id);
      user.stripeCustomerId = customer.id;
    }

    // Create checkout session
    console.log('Creating checkout session with customerId:', user.stripeCustomerId);
    const session = await createCheckoutSession(user.stripeCustomerId, user.id);
    console.log('Checkout session created:', session.id);

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Error managing subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;