import { Router } from "express";
import { storage } from "../storage";
import { createCustomer } from "../services/stripe";
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

export default router;
