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

// Enhanced debug logging
app.use((req, res, next) => {
  log(`${process.env.NODE_ENV} :: ${req.method} ${req.path} :: ${Date.now()}`);
  next();
});

(async () => {
  try {
    const server = registerRoutes(app);

    // Development error handling with full details
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      res.status(status).json({ message, stack: err.stack });
      console.error('Error:', err);
    });

    // Always use Vite in development mode
    await setupVite(app, server);

    const port = 5000; // Fixed port for production compatibility

    function startServer(retries = 3) {
      server.listen(port, "0.0.0.0", () => {
        log(`Development server starting...`);
        log(`Server running at http://0.0.0.0:${port}`);
        log(`Environment: ${process.env.NODE_ENV}`);
        log(`Timestamp: ${Date.now()}`);
        log('Press Ctrl+C to stop the server');
      }).on('error', (error: any) => {
        if (error.code === 'EADDRINUSE' && retries > 0) {
          log(`Port ${port} is in use. Attempting to terminate existing process...`);
          // Try to force close the port and retry
          import('child_process').then(({ exec }) => {
            exec(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`, (err) => {
              if (err) {
                log(`Failed to free port ${port}. Please manually terminate the process using it.`);
                process.exit(1);
              }
              log(`Successfully freed port ${port}. Retrying server start...`);
              setTimeout(() => startServer(retries - 1), 1000);
            });
          });
        } else {
          console.error('Server error:', error);
          process.exit(1);
        }
      });
    }

    startServer();

    // Handle process termination
    const cleanup = () => {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      cleanup();
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();