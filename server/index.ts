import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force development mode and disable all caching
const isDev = process.env.NODE_ENV !== 'production';
process.env.NODE_ENV = isDev ? 'development' : 'production';
log(`Starting server in ${process.env.NODE_ENV} mode with timestamp ${Date.now()}`);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enhanced error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error occurred:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ 
    message, 
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    log(`${process.env.NODE_ENV} :: ${req.method} ${req.path} :: ${res.statusCode} :: ${duration}ms`);
  });
  next();
});

(async () => {
  try {
    const server = registerRoutes(app);

    if (isDev) {
      // Development mode: Use Vite middleware
      await setupVite(app, server);
    } else {
      // Production mode: Serve static files
      serveStatic(app);
    }

    const port = Number(process.env.PORT) || 5000;
    let currentPort = port;

    // Enhanced error handling for server startup
    const startServer = (port: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          server.listen(port, "0.0.0.0", () => {
            log(`Server running at http://0.0.0.0:${port}`);
            log(`Environment: ${process.env.NODE_ENV}`);
            log(`Timestamp: ${Date.now()}`);
            resolve();
          });

          server.on('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
              log(`Port ${port} is in use, trying next port...`);
              reject(error);
            } else {
              console.error('Server error:', error);
              reject(error);
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    };

    // Try to start server with port fallback
    while (currentPort < port + 10) {
      try {
        await startServer(currentPort);
        break;
      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          currentPort++;
        } else {
          throw error;
        }
      }
    }

    // Graceful shutdown handling
    const cleanup = () => {
      log('Shutting down server gracefully...');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        log('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      cleanup();
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      cleanup();
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();