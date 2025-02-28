import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure NODE_ENV and PORT are explicitly set
const isDev = process.env.NODE_ENV !== 'production' && process.env.REPLIT_ENVIRONMENT !== 'production';
process.env.NODE_ENV = isDev ? 'development' : 'production';
process.env.PORT = process.env.PORT || '5000';

log(`Starting server in ${process.env.NODE_ENV} mode`);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error occurred:', err);
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

// Function to attempt binding to a port
const bindServer = (port: number, maxAttempts = 3, attempt = 1): Promise<http.Server> => {
  return new Promise((resolve, reject) => {
    try {
      log(`Attempting to bind to port ${port} (attempt ${attempt}/${maxAttempts})...`);

      // Set up Express app and register routes
      const server = registerRoutes(app);

      // Set up error handling for the server
      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          log(`Port ${port} is already in use. ${attempt < maxAttempts ? 'Trying again with next port.' : 'Maximum attempts reached.'}`);
          if (attempt < maxAttempts) {
            // Try next port
            const nextPort = port + 1;
            process.env.PORT = nextPort.toString();
            log(`Switching to port ${nextPort}`);
            bindServer(nextPort, maxAttempts, attempt + 1)
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error(`Could not bind to any port after ${maxAttempts} attempts. Please free up ports and restart.`));
          }
        } else {
          log(`Failed to start server: ${error.message}`);
          reject(error);
        }
      });

      // Start the server
      server.listen(port, "0.0.0.0", () => {
        log(`Server successfully bound to port ${port}`);
        resolve(server);
      });

    } catch (error) {
      reject(error);
    }
  });
};

(async () => {
  try {
    log('Initializing server...');
    log('Environment variables:');
    log(`- NODE_ENV: ${process.env.NODE_ENV}`);
    log(`- PORT: ${process.env.PORT}`);
    log(`- REPLIT_ENVIRONMENT: ${process.env.REPLIT_ENVIRONMENT || 'not set'}`);
    log(`- REPL_ID: ${process.env.REPL_ID || 'not set'}`);
    log(`- REPL_SLUG: ${process.env.REPL_SLUG || 'not set'}`);

    log('Setting up Express application...');

    // In production, always serve from dist
    if (isDev) {
      log('Development mode: Setting up Vite middleware');

      // Set up the server first without binding
      const server = registerRoutes(app);

      try {
        await setupVite(app, server);
        log('Vite middleware setup complete');

        const port = Number(process.env.PORT);
        log(`Attempting to start development server on port ${port}...`);
        log(`Server will bind to host: 0.0.0.0 (all interfaces)`);

        server.listen(port, "0.0.0.0", () => {
          log(`Server running at http://0.0.0.0:${port}`);
          log(`Environment: ${process.env.NODE_ENV}`);

          // Add detailed server info logging
          log(`Server is now listening with the following details:`);
          log(`- Protocol: HTTP`);
          log(`- Host: 0.0.0.0 (all interfaces)`);
          log(`- Port: ${port}`);
          log(`- Process ID: ${process.pid}`);
          log(`- Date/Time: ${new Date().toISOString()}`);
        });

      } catch (error) {
        log(`Failed to setup Vite middleware: ${error}`);
        throw error;
      }
    } else {
      log('Production mode: Serving static files from dist');
      serveStatic(app);

      const port = Number(process.env.PORT);
      log(`Attempting to start production server on port ${port}...`);
      log(`Server will bind to host: 0.0.0.0 (all interfaces)`);

      // Try binding with automatic port selection on failure
      const server = await bindServer(port);

      // Server is now running, add graceful shutdown handling
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

      // Add detailed server info logging
      log(`Server is now listening with the following details:`);
      log(`- Protocol: HTTP`);
      log(`- Host: 0.0.0.0 (all interfaces)`);
      log(`- Port: ${process.env.PORT}`);
      log(`- Process ID: ${process.pid}`);
      log(`- Date/Time: ${new Date().toISOString()}`);

      // Self-check using HTTP module
      setTimeout(() => {
        try {
          const options = {
            hostname: 'localhost',
            port: Number(process.env.PORT),
            path: '/',
            method: 'HEAD',
            timeout: 3000
          };

          const req = http.request(options, (res: any) => {
            log(`Self-check request completed with status: ${res.statusCode}`);
          });

          req.on('error', (e: Error) => {
            log(`Self-check request failed: ${e.message}`);
          });

          req.on('timeout', () => {
            log(`Self-check request timed out`);
            req.destroy();
          });

          req.end();
        } catch (error) {
          log(`Failed to perform self-check: ${error}`);
        }
      }, 1000);
    }

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