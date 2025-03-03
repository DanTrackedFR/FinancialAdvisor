import express from 'express';
import { 
  exportAllDataToBigQuery, 
  initializeBigQueryResources, 
  generateServiceAccountKeyFile 
} from '../services/bigquery';
import { storage } from '../storage';

const router = express.Router();

// Admin emails list - should be moved to a configuration file in production
const ADMIN_EMAILS = [
  'admin@trackedfr.com',
  'support@trackedfr.com'
  // Add other admin emails here
];

// Middleware to check if the user is an admin
async function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const firebaseUid = req.headers['firebase-uid'] as string;

  if (!firebaseUid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await storage.getUserByFirebaseUid(firebaseUid);

  // Check if user exists and has an admin email
  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  next();
}

// Route to initialize BigQuery resources (dataset and tables)
router.post('/bigquery/initialize', isAdmin, async (req, res) => {
  try {
    const success = await initializeBigQueryResources();

    if (success) {
      res.status(200).json({ message: 'BigQuery resources initialized successfully' });
    } else {
      res.status(500).json({ error: 'Failed to initialize BigQuery resources' });
    }
  } catch (error) {
    console.error('Error initializing BigQuery resources:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Route to trigger data export to BigQuery
router.post('/bigquery/export', isAdmin, async (req, res) => {
  try {
    const success = await exportAllDataToBigQuery();

    if (success) {
      res.status(200).json({ message: 'Data exported to BigQuery successfully' });
    } else {
      res.status(500).json({ error: 'Failed to export data to BigQuery' });
    }
  } catch (error) {
    console.error('Error exporting data to BigQuery:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Route to get BigQuery configuration status
router.get('/bigquery/status', isAdmin, async (req, res) => {
  try {
    // Check if service account key file exists
    const keyFilePath = generateServiceAccountKeyFile();
    const hasCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    res.status(200).json({
      configured: hasCredentials,
      credentials: hasCredentials ? process.env.GOOGLE_APPLICATION_CREDENTIALS : null,
      keyFilePath,
      datasetId: process.env.BIGQUERY_DATASET_ID || 'trackedfr_analytics',
    });
  } catch (error) {
    console.error('Error checking BigQuery status:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;