import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Get daily active users
router.get("/daily-users", async (req, res) => {
  try {
    const startDate = new Date(req.query.start as string);
    const endDate = new Date(req.query.end as string);
    const data = await storage.getDailyActiveUsers(startDate, endDate);
    res.json(data);
  } catch (error) {
    console.error("Error fetching daily users:", error);
    res.status(500).json({ error: "Failed to fetch daily users" });
  }
});

// Get popular pages
router.get("/popular-pages", async (req, res) => {
  try {
    const startDate = new Date(req.query.start as string);
    const endDate = new Date(req.query.end as string);
    const data = await storage.getPopularPages(startDate, endDate);
    res.json(data);
  } catch (error) {
    console.error("Error fetching popular pages:", error);
    res.status(500).json({ error: "Failed to fetch popular pages" });
  }
});

// Get average session duration
router.get("/session-duration", async (req, res) => {
  try {
    const duration = await storage.getAverageSessionDuration();
    res.json(duration);
  } catch (error) {
    console.error("Error fetching session duration:", error);
    res.status(500).json({ error: "Failed to fetch session duration" });
  }
});

// Get recent user actions
router.get("/recent-actions", async (req, res) => {
  try {
    // Get the 20 most recent actions from all users if no userId is specified
    if (!req.query.userId) {
      const actions = await storage.getUserActions(0); // Get all recent actions
      return res.json(actions.slice(0, 20)); // Limit to 20 most recent
    }

    // Convert userId to number and validate
    const userId = parseInt(req.query.userId as string, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const actions = await storage.getUserActions(userId);
    res.json(actions);
  } catch (error) {
    console.error("Error fetching recent actions:", error);
    res.status(500).json({ error: "Failed to fetch recent actions" });
  }
});

export default router;