import { BigQuery } from '@google-cloud/bigquery';
import { storage } from '../storage';
import * as fs from 'fs';
import * as path from 'path';

// Check if we have the required environment variables
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. BigQuery export will not work.');
}

// Initialize BigQuery client
let bigqueryClient: BigQuery | null = null;

try {
  bigqueryClient = new BigQuery({
    // If running on Google Cloud, this will use the default credentials
    // Otherwise, it will use the credentials file specified in GOOGLE_APPLICATION_CREDENTIALS
  });
  console.log('BigQuery client initialized successfully');
} catch (error) {
  console.error('Failed to initialize BigQuery client:', error);
}

// Dataset and table names
const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'trackedfr_analytics';
const USERS_TABLE_ID = 'users';
const FEEDBACK_TABLE_ID = 'feedback';
const ANALYSES_TABLE_ID = 'analyses';
const ANALYTICS_TABLE_ID = 'analytics';

/**
 * Creates BigQuery dataset and tables if they don't exist
 */
export async function initializeBigQueryResources(): Promise<boolean> {
  if (!bigqueryClient) {
    console.error('BigQuery client not initialized');
    return false;
  }

  try {
    // Check if dataset exists, create if not
    const [datasetExists] = await bigqueryClient.dataset(DATASET_ID).exists();

    if (!datasetExists) {
      console.log(`Creating dataset: ${DATASET_ID}`);
      await bigqueryClient.createDataset(DATASET_ID, {
        location: 'US', // Specify your preferred location
      });
      console.log(`Dataset ${DATASET_ID} created successfully`);
    }

    // Define table schemas
    const userTableSchema = [
      { name: 'id', type: 'INTEGER' },
      { name: 'email', type: 'STRING' },
      { name: 'firebase_uid', type: 'STRING' },
      { name: 'first_name', type: 'STRING' },
      { name: 'surname', type: 'STRING' },
      { name: 'company', type: 'STRING' },
      { name: 'created_at', type: 'TIMESTAMP' },
      { name: 'last_logged_in', type: 'TIMESTAMP' },
      { name: 'subscription_status', type: 'STRING' },
      { name: 'stripe_customer_id', type: 'STRING' },
      { name: 'trial_ends_at', type: 'TIMESTAMP' },
    ];

    const feedbackTableSchema = [
      { name: 'id', type: 'INTEGER' },
      { name: 'user_id', type: 'INTEGER' },
      { name: 'rating', type: 'INTEGER' },
      { name: 'comment', type: 'STRING' },
      { name: 'created_at', type: 'TIMESTAMP' },
      { name: 'resolved', type: 'BOOLEAN' },
      { name: 'admin_response', type: 'STRING' },
      { name: 'responded_at', type: 'TIMESTAMP' },
    ];

    const analyticsTableSchema = [
      { name: 'date', type: 'DATE' },
      { name: 'active_users', type: 'INTEGER' },
      { name: 'new_users', type: 'INTEGER' },
      { name: 'total_sessions', type: 'INTEGER' },
      { name: 'avg_session_duration', type: 'FLOAT' },
      { name: 'popular_pages', type: 'STRING', mode: 'REPEATED' },
    ];

    // Create tables if they don't exist
    await createTableIfNotExists(DATASET_ID, USERS_TABLE_ID, userTableSchema);
    await createTableIfNotExists(DATASET_ID, FEEDBACK_TABLE_ID, feedbackTableSchema);
    await createTableIfNotExists(DATASET_ID, ANALYTICS_TABLE_ID, analyticsTableSchema);

    console.log('BigQuery resources initialized successfully');
    return true;

  } catch (error) {
    console.error('Failed to initialize BigQuery resources:', error);
    return false;
  }
}

/**
 * Helper function to create a table if it doesn't exist
 */
async function createTableIfNotExists(datasetId: string, tableId: string, schema: any[]): Promise<void> {
  if (!bigqueryClient) return;

  const [tableExists] = await bigqueryClient.dataset(datasetId).table(tableId).exists();

  if (!tableExists) {
    console.log(`Creating table: ${tableId}`);
    await bigqueryClient.dataset(datasetId).createTable(tableId, {
      schema: schema,
    });
    console.log(`Table ${tableId} created successfully`);
  }
}

/**
 * Exports user data to BigQuery
 */
export async function exportUsersToBigQuery(): Promise<boolean> {
  if (!bigqueryClient) {
    console.error('BigQuery client not initialized');
    return false;
  }

  try {
    // Get all users from the database
    const users = await storage.getAllUsers();

    if (!users.length) {
      console.log('No users to export');
      return true;
    }

    // Transform user data to match BigQuery schema
    const userRows = users.map(user => ({
      id: user.id,
      email: user.email,
      firebase_uid: user.firebaseUid,
      first_name: user.firstName,
      surname: user.surname,
      company: user.company,
      created_at: user.createdAt ? new Date(user.createdAt).toISOString() : null,
      last_logged_in: user.lastLoggedIn ? new Date(user.lastLoggedIn).toISOString() : null,
      subscription_status: user.subscriptionStatus,
      stripe_customer_id: user.stripeCustomerId,
      trial_ends_at: user.trialEndsAt ? new Date(user.trialEndsAt).toISOString() : null,
    }));

    // Insert data into BigQuery table
    await bigqueryClient
      .dataset(DATASET_ID)
      .table(USERS_TABLE_ID)
      .insert(userRows, { 
        // Skip invalid rows
        skipInvalidRows: true,
        // Don't require all fields
        ignoreUnknownValues: true
      });

    console.log(`Successfully exported ${userRows.length} users to BigQuery`);
    return true;

  } catch (error) {
    console.error('Failed to export users to BigQuery:', error);
    return false;
  }
}

/**
 * Exports feedback data to BigQuery
 */
export async function exportFeedbackToBigQuery(): Promise<boolean> {
  if (!bigqueryClient) {
    console.error('BigQuery client not initialized');
    return false;
  }

  try {
    // Get all feedback from the database
    const feedbackItems = await storage.getAllFeedback();

    if (!feedbackItems.length) {
      console.log('No feedback to export');
      return true;
    }

    // Transform feedback data to match BigQuery schema
    const feedbackRows = feedbackItems.map(feedback => ({
      id: feedback.id,
      user_id: feedback.userId,
      rating: feedback.rating,
      comment: feedback.comment,
      created_at: feedback.createdAt ? new Date(feedback.createdAt).toISOString() : null,
      resolved: feedback.resolved,
      admin_response: feedback.adminResponse,
      responded_at: feedback.respondedAt ? new Date(feedback.respondedAt).toISOString() : null,
    }));

    // Insert data into BigQuery table
    await bigqueryClient
      .dataset(DATASET_ID)
      .table(FEEDBACK_TABLE_ID)
      .insert(feedbackRows, { 
        skipInvalidRows: true,
        ignoreUnknownValues: true
      });

    console.log(`Successfully exported ${feedbackRows.length} feedback items to BigQuery`);
    return true;

  } catch (error) {
    console.error('Failed to export feedback to BigQuery:', error);
    return false;
  }
}

/**
 * Exports analytics data to BigQuery
 */
export async function exportAnalyticsToBigQuery(): Promise<boolean> {
  if (!bigqueryClient) {
    console.error('BigQuery client not initialized');
    return false;
  }

  try {
    // Get current date
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Get analytics data from storage
    const dailyActiveUsers = await storage.getDailyActiveUsers(thirtyDaysAgo, today);
    const popularPages = await storage.getPopularPages(thirtyDaysAgo, today);
    const avgSessionDuration = await storage.getAverageSessionDuration();

    // Calculate new users in the last 30 days
    const users = await storage.getAllUsers();
    const newUsers = users.filter(user => 
      user.createdAt && new Date(user.createdAt) >= thirtyDaysAgo
    ).length;

    // Transform analytics data
    const analyticsRow = {
      date: today.toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      active_users: dailyActiveUsers.reduce((sum, day) => sum + day.count, 0),
      new_users: newUsers,
      total_sessions: 0, // This would need to be calculated from your session data
      avg_session_duration: avgSessionDuration,
      popular_pages: popularPages.map(p => `${p.path}: ${p.views} views`),
    };

    // Insert data into BigQuery table
    await bigqueryClient
      .dataset(DATASET_ID)
      .table(ANALYTICS_TABLE_ID)
      .insert(analyticsRow);

    console.log('Successfully exported analytics data to BigQuery');
    return true;

  } catch (error) {
    console.error('Failed to export analytics to BigQuery:', error);
    return false;
  }
}

/**
 * Main export function to push all data to BigQuery
 */
export async function exportAllDataToBigQuery(): Promise<boolean> {
  console.log('Starting BigQuery data export...');

  try {
    // Initialize BigQuery resources first (creates dataset and tables if needed)
    const initialized = await initializeBigQueryResources();
    if (!initialized) {
      console.error('Failed to initialize BigQuery resources. Export aborted.');
      return false;
    }

    // Export data in parallel
    const results = await Promise.all([
      exportUsersToBigQuery(),
      exportFeedbackToBigQuery(),
      exportAnalyticsToBigQuery()
    ]);

    // Check if all exports were successful
    const allSuccessful = results.every(success => success);

    if (allSuccessful) {
      console.log('All data successfully exported to BigQuery');
      return true;
    } else {
      console.warn('Some data exports to BigQuery failed');
      return false;
    }

  } catch (error) {
    console.error('Error during BigQuery export:', error);
    return false;
  }
}

/**
 * Generates a service account key file if it doesn't exist
 * You'll need to fill this with your Google Cloud service account key
 */
export function generateServiceAccountKeyFile(): string {
  const keyFilePath = path.join(process.cwd(), 'google-cloud-key.json');

  if (!fs.existsSync(keyFilePath)) {
    console.log('Google Cloud service account key file does not exist.');
    console.log('You need to create a service account in Google Cloud and download the key file.');
    console.log('Then set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the path of the key file.');
  } else {
    console.log('Google Cloud service account key file found at:', keyFilePath);
  }

  return keyFilePath;
}