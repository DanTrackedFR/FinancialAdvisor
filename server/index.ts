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

// Enhanced request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    log(`${process.env.NODE_ENV} :: ${req.method} ${req.path} :: ${res.statusCode} :: ${duration}ms`);
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
    const server = registerRoutes(app);

    // Development error handling with full details
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      log(`Error handling request: ${message}`);
      res.status(status).json({ message, stack: isDev ? err.stack : undefined });
    });

    // Always use Vite in development mode
    await setupVite(app, server);

    const port = 5000; // Fixed port for production compatibility

    // Initialize server with retry mechanism
    async function startServer(): Promise<boolean> {
      return new Promise((resolve) => {
        const serverInstance = server.listen(port, "0.0.0.0", () => {
          log(`Server started successfully on port ${port}`);
          log(`Environment: ${process.env.NODE_ENV}`);
          log(`Timestamp: ${Date.now()}`);
          resolve(true);
        });

        serverInstance.on('error', async (error: any) => {
          if (error.code === 'EADDRINUSE') {
            log(`Port ${port} is in use, attempting to free it...`);
            try {
              const { exec } = await import('child_process');
              exec(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`, async (err) => {
                if (err) {
                  log(`Failed to free port ${port}: ${err.message}`);
                  resolve(false);
                } else {
                  log(`Successfully freed port ${port}`);
                  // Wait briefly before retry
                  await new Promise(r => setTimeout(r, 1000));
                  resolve(await startServer());
                }
              });
            } catch (err) {
              log(`Error freeing port: ${err}`);
              resolve(false);
            }
          } else {
            log(`Server error: ${error.message}`);
            resolve(false);
          }
        });
      });
    }

    // Attempt to start server with retries
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      log(`Attempting to start server (attempt ${attempts + 1}/${maxAttempts})`);
      if (await startServer()) {
        break;
      }
      attempts++;
      if (attempts === maxAttempts) {
        throw new Error(`Failed to start server after ${maxAttempts} attempts`);
      }
      // Wait between attempts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

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