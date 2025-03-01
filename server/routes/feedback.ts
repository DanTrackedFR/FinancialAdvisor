import { Router } from "express";
import { storage } from "../storage";
import { insertFeedbackSchema } from "@shared/schema";

const router = Router();

// Submit feedback
router.post("/feedback", async (req, res) => {
  try {
    const firebaseUid = req.headers["firebase-uid"] as string;
    console.log("Feedback submission received with headers:", {
      firebaseUid: firebaseUid ? "present" : "missing",
      contentType: req.headers["content-type"]
    });
    console.log("Request body:", req.body);

    if (!firebaseUid) {
      console.error("Feedback submission failed: Missing firebase-uid header");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      console.error(`Feedback submission failed: User not found for UID ${firebaseUid}`);
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`Found user with ID ${user.id} for feedback submission`);

    try {
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        userId: user.id
      });

      console.log("Feedback data validated:", feedbackData);

      const feedback = await storage.createFeedback(feedbackData);
      console.log("Feedback created successfully with ID:", feedback.id);
      res.status(201).json(feedback);
    } catch (validationError) {
      console.error("Validation error when parsing feedback data:", validationError);
      res.status(400).json({ 
        error: "Invalid feedback data", 
        details: validationError instanceof Error ? validationError.message : "Unknown validation error" 
      });
    }
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : "Failed to submit feedback" 
    });
  }
});

// Get user's feedback (for users to see their own submissions)
router.get("/feedback/user", async (req, res) => {
  try {
    const firebaseUid = req.headers["firebase-uid"] as string;
    if (!firebaseUid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const feedback = await storage.getUserFeedback(user.id);
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching user feedback:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch feedback" 
    });
  }
});

// Get all feedback (for admin use)
router.get("/feedback", async (req, res) => {
  try {
    const firebaseUid = req.headers["firebase-uid"] as string;
    if (!firebaseUid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only admins should be able to see all feedback
    // We could add an isAdmin field to the users table for better authorization
    const allFeedback = await storage.getAllFeedback();
    res.json(allFeedback);
  } catch (error) {
    console.error("Error fetching all feedback:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch feedback" 
    });
  }
});

// Update feedback resolution (for admin use)
router.patch("/feedback/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { resolved, adminResponse } = req.body;

    if (typeof resolved !== 'boolean') {
      return res.status(400).json({ error: "Resolved status is required" });
    }

    await storage.updateFeedbackResolution(id, resolved, adminResponse);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to update feedback" 
    });
  }
});

export default router;