import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { insertContactMessageSchema } from '@shared/schema';

const router = express.Router();

// Schema for validating contact form data
const contactFormSchema = insertContactMessageSchema.extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Please provide a message of at least 10 characters")
});

// POST endpoint to submit a contact message
router.post('/contact', async (req, res) => {
  try {
    // Validate the incoming data
    const validatedData = contactFormSchema.parse(req.body);
    
    // Store the message in the database
    const contactMessage = await storage.createContactMessage(validatedData);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: "Contact message received successfully",
      id: contactMessage.id
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }
    
    // Handle other errors
    res.status(500).json({
      success: false,
      message: "Failed to process your message. Please try again later."
    });
  }
});

// GET endpoint to retrieve all contact messages (admin only)
router.get('/contact-messages', async (req, res) => {
  try {
    // In a real implementation, we would add auth middleware to ensure only admins can access this
    const messages = await storage.getContactMessages();
    res.json(messages);
  } catch (error) {
    console.error('Error retrieving contact messages:', error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve contact messages"
    });
  }
});

// GET endpoint to retrieve a specific contact message by ID (admin only)
router.get('/contact-messages/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact message ID"
      });
    }
    
    const message = await storage.getContactMessage(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found"
      });
    }
    
    res.json(message);
  } catch (error) {
    console.error('Error retrieving contact message:', error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve contact message"
    });
  }
});

// PATCH endpoint to update contact message status (admin only)
router.patch('/contact-messages/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact message ID"
      });
    }
    
    const { read, resolved, notes } = req.body;
    
    // Update the message status
    await storage.updateContactMessageStatus(id, read, resolved, notes);
    
    res.json({
      success: true,
      message: "Contact message updated successfully"
    });
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update contact message"
    });
  }
});

export default router;