import { Router } from "express";
import { storage } from "../storage";
import { createCustomer, createSubscription } from "../services/stripe";
import { insertUserSchema } from "@shared/schema";

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

router.get("/users/profile", async (req, res) => {
  try {
    const firebaseUid = req.headers["firebase-uid"];
    if (!firebaseUid || typeof firebaseUid !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/users/profile", async (req, res) => {
  try {
    const firebaseUid = req.headers["firebase-uid"];
    if (!firebaseUid || typeof firebaseUid !== "string") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await storage.updateUser(user.id, req.body);
    res.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user profile:", error);
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
      user.stripeCustomerId = customer.id;
    }

    // Create or retrieve subscription
    const subscription = await createSubscription(user.stripeCustomerId, user.id);

    // Return the checkout URL if available
    if (subscription.latest_invoice?.payment_intent) {
      const intent = subscription.latest_invoice.payment_intent;
      if (intent.client_secret) {
        res.json({ 
          url: `https://dashboard.stripe.com/test/setup/${intent.client_secret}`
        });
        return;
      }
    }

    res.json({ error: "Unable to create subscription checkout" });
  } catch (error: any) {
    console.error("Error managing subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;