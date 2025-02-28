import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";

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

(async () => {
  try {
    log('Initializing server...');

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

    const port = Number(process.env.PORT) || 5000;
    log(`Attempting to start server on port ${port}...`);

    // Add error handling for the server
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use. Please free up the port and try again.`);
        process.exit(1);
      } else {
        log(`Failed to start server: ${error.message}`);
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