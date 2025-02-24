import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force development mode and disable all caching
const isDev = true; // Force development mode
process.env.NODE_ENV = 'development';
log(`Starting server in ${process.env.NODE_ENV} mode with timestamp ${Date.now()}`);
log('Development mode detected - enforcing no-cache policy');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Force no caching in development
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('Surrogate-Control', 'no-store');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  log(`Incoming ${req.method} request to ${req.url}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.url} completed with status ${res.statusCode} in ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: Date.now(),
    env: process.env.NODE_ENV,
    port: 5000
  });
});

(async () => {
  try {
    // Create HTTP server first
    const server = registerRoutes(app);

    // API routes error handling
    app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) {
        const status = err.status || err.statusCode || 500;
        const message = err.message || 'Internal Server Error';
        log(`API Error: ${status} - ${message}`);
        return res.status(status).json({
          error: message,
          status,
          path: req.path,
          timestamp: Date.now()
        });
      }
      next(err);
    });

    if (isDev) {
      // Development mode: Use Vite middleware
      log('Setting up Vite middleware for development...');
      await setupVite(app, server);
    } else {
      // Production mode: Serve static files
      log('Setting up static file serving for production...');
      serveStatic(app);
    }

    // Generic error handler (after all routes)
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      log(`General Error: ${status} - ${message}`);
      if (req.path.startsWith('/api')) {
        return res.status(status).json({ error: message });
      }
      // For non-API routes in development, let Vite handle the error
      if (isDev) {
        next(err);
      } else {
        // In production, serve the error page
        res.status(status).send('Server Error');
      }
    });

    const port = 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`Server started successfully on port ${port}`);
      log(`Environment: ${process.env.NODE_ENV}`);
      log(`Timestamp: ${Date.now()}`);
    });

    // Graceful shutdown handling
    const cleanup = () => {
      log('Shutting down server...');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('uncaughtException', (err) => {
      log(`Uncaught exception: ${err.message}`);
      cleanup();
    });

  } catch (error) {
    log(`Failed to start server: ${error}`);
    process.exit(1);
  }
})();