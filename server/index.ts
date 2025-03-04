import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeFirebaseAdmin } from "./lib/firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure NODE_ENV is explicitly set
const isDev = process.env.NODE_ENV !== 'production';
process.env.NODE_ENV = isDev ? 'development' : 'production';

log(`Starting server in ${process.env.NODE_ENV} mode`);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error occurred:', err);

  // Add more detailed logging for Firebase errors
  if (err.code && err.code.includes('firebase')) {
    console.error('Firebase error details:', {
      code: err.code,
      message: err.message,
      context: err.context || 'unknown'
    });
  }

  res.status(err.status || 500).json({ 
    message: err.message || 'Internal Server Error',
    ...(isDev ? { stack: err.stack } : {})
  });
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.path} :: ${res.statusCode} :: ${duration}ms`);
  });
  next();
});

// Function to find an available port
async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  let currentPort = startPort;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const server = await new Promise<any>((resolve, reject) => {
        const server = require('http').createServer();
        server.listen(currentPort, '0.0.0.0');
        server.once('listening', () => {
          server.close();
          resolve(server);
        });
        server.once('error', reject);
      });
      return currentPort;
    } catch (err) {
      attempts++;
      log(`Port ${currentPort} is in use, trying ${currentPort + 1}...`);
      currentPort++;
    }
  }

  throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
}

(async () => {
  try {
    log('Initializing server...');

    // Move Firebase initialization to happen after the server starts
    // More detailed logging for initialization steps
    log('Setting up Express application...');
    const server = registerRoutes(app);
    log('Routes registered successfully');

    // Check Firebase credentials in production
    if (!isDev) {
      const missingCredentials = [];
      if (!process.env.FIREBASE_PROJECT_ID) missingCredentials.push('FIREBASE_PROJECT_ID');
      if (!process.env.FIREBASE_CLIENT_EMAIL) missingCredentials.push('FIREBASE_CLIENT_EMAIL');
      if (!process.env.FIREBASE_PRIVATE_KEY) missingCredentials.push('FIREBASE_PRIVATE_KEY');
      
      if (missingCredentials.length > 0) {
        log(`⚠️ Warning: Missing Firebase credentials in production: ${missingCredentials.join(', ')}`);
        log('Some authentication features may not work correctly');
      }
    }
    
    // In production, always serve from dist
    if (isDev) {
      log('Development mode: Setting up Vite middleware');
      try {
        await setupVite(app, server);
        log('Vite middleware setup complete');
      } catch (error) {
        log(`Failed to setup Vite middleware: ${error}`);
        throw error;
      }
    } else {
      log('Production mode: Serving static files from dist');
      serveStatic(app);
    }

    // Simplified port handling
    const PORT = Number(process.env.PORT) || (isDev ? 5000 : 8080);
    log(`Server will use port ${PORT} in ${isDev ? 'development' : 'production'} mode`);

    // Simplified error handling
    server.on('error', async (error: any) => {
      const timeStamp = new Date().toISOString();
      if (error.code === 'EADDRINUSE') {
        log(`${timeStamp} [express] ❌ Port ${PORT} is already in use.`);
        
        if (isDev) {
          // In development, try to find another port
          try {
            const newPort = PORT + 1000; // Try a port with significant offset to avoid conflicts
            log(`${timeStamp} [express] Attempting to use alternative port ${newPort}...`);
            
            server.listen(newPort, "0.0.0.0", () => {
              log(`${timeStamp} [express] Server started on alternative port ${newPort}`);
              log(`${timeStamp} [express] 🚀 API running at http://0.0.0.0:${newPort}/api`);
            });
          } catch (retryError) {
            log(`${timeStamp} [express] Failed to start on alternative port: ${retryError}`);
            process.exit(1);
          }
        } else {
          // In production, this is a fatal error
          log(`${timeStamp} [express] ❌ In production mode, fixed port is required. Please ensure port ${PORT} is available.`);
          process.exit(1);
        }
      } else {
        log(`${timeStamp} [express] ❌ Failed to start server:`, error);
        process.exit(1);
      }
    });

    // Graceful shutdown handler
    const shutdown = () => {
      log('Shutting down gracefully...');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });

      // Force shutdown after 5 seconds if graceful shutdown fails
      setTimeout(() => {
        log('Force shutting down...');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Start the server on a fixed port
    log(`Starting server on port ${PORT}...`);
    server.listen(PORT, "0.0.0.0", async () => {
      log(`Server running at http://0.0.0.0:${PORT}`);
      log(`Environment: ${process.env.NODE_ENV}`);
      
      // Initialize Firebase Admin after the server has started
      try {
        await initializeFirebaseAdmin();
        log('Firebase Admin SDK initialized successfully after server start');
      } catch (error) {
        log(`Warning: Firebase Admin initialization failed: ${error}`);
        log('Continuing without Firebase Admin, some features may not work');
      }
      
      log(`⚡️ All systems ready - ${isDev ? 'development' : 'production'} server is now live`);
    });

  } catch (error) {
    log(`Critical error during server startup: ${error}`);
    // Add more detailed error information
    if (error instanceof Error) {
      log(`Error name: ${error.name}`);
      log(`Error message: ${error.message}`);
      log(`Error stack: ${error.stack}`);
    }
    process.exit(1);
  }
})();