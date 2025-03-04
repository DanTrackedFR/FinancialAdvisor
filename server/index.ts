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

    // Try to initialize Firebase Admin  (Corrected Initialization)
    try {
      await initializeFirebaseAdmin();
    } catch (error) {
      log(`Warning: Firebase Admin initialization failed: ${error}`);
      log('Continuing without Firebase Admin, some features may not work');
    }

    // More detailed logging for initialization steps
    log('Setting up Express application...');
    const server = registerRoutes(app);
    log('Routes registered successfully');

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

    // In production, use fixed port 5000; in development, find available port
    let port;
    if (process.env.NODE_ENV === 'production') {
      port = 5000; // Use fixed port for production deployment
      console.log(`[express] Production mode: Using fixed port ${port}`);
    } else {
      // Find an available port (Improved Port Selection)
      const requestedPort = Number(process.env.PORT) || 5000;
      try {
        port = await findAvailablePort(requestedPort, 10); // Added maxAttempts for robustness
        console.log(`[express] Development mode: Using port ${port}`);
      } catch (error) {
        console.error(`[express] Error finding available port: ${error}. Falling back to port 5001`);
        port = 5001; // Fallback port in case of failure to prevent deployment failure
      }
    }

    // Improved Error Handling
    server.on('error', async (error: any) => {
      const timeStamp = new Date().toISOString();
      if (error.code === 'EADDRINUSE') {
        log(`${timeStamp} [express] ❌ Port ${port} is already in use. Try another port or stop the current process.`);

        // Try again with a different port (Improved retry mechanism)
        let alternativePort = port + 1;
        while (true) {
          try {
            const available = await findAvailablePort(alternativePort,1)
            port = available
            server.listen(port, "0.0.0.0", () => {
              log(`${timeStamp} [express] Server started successfully on alternative port ${port}`);
              log(`${timeStamp} [express] 🚀 API running at http://0.0.0.0:${port}/api`);
            });
            break;
          } catch (error) {
              alternativePort++;
              if (alternativePort > 6000){
                  console.error(`[express] Could not find a free port after multiple retries. Exiting.`);
                  process.exit(1);
              }
              log(`${timeStamp} [express] Port ${alternativePort -1} in use, trying ${alternativePort}...`);
          }
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

    // Start the server
    server.listen(port, "0.0.0.0", () => {
      log(`Server running at http://0.0.0.0:${port}`);
      log(`Environment: ${process.env.NODE_ENV}`);
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