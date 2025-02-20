import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Production-optimized CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://trackedfr.com',
    'https://www.trackedfr.com'
  ];

  // Only add development URLs in non-production environment
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:5000', 'http://localhost:3000');
  }

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, firebase-uid, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    // Add security headers for production
    if (process.env.NODE_ENV === 'production') {
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'SAMEORIGIN');
      res.header('X-XSS-Protection', '1; mode=block');
    }
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Production-optimized request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Only log API requests in production
  if (process.env.NODE_ENV === 'production' && !path.startsWith("/api")) {
    return next();
  }

  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && process.env.NODE_ENV !== 'production') {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });
  next();
});

(async () => {
  const server = registerRoutes(app);

  // Production-optimized error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : (err.message || 'Internal Server Error');
    res.status(status).json({ message });
    console.error(err);
  });

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    const publicPath = path.resolve(__dirname, "public");

    if (!fs.existsSync(publicPath)) {
      throw new Error(
        `Could not find the build directory: ${publicPath}, make sure to build the client first`,
      );
    }

    // Production-optimized static file serving
    app.use(express.static(publicPath, {
      maxAge: '30d', // Increased cache duration for production
      etag: true,
      lastModified: true,
      immutable: true, // For files with content hash
      compress: true  // Enable compression
    }));

    // SPA fallback route
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
      } else {
        res.sendFile(path.join(publicPath, 'index.html'), {
          maxAge: '0', // Don't cache the index.html file
          etag: true,
          lastModified: true
        });
      }
    });
  }

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port} in ${process.env.NODE_ENV} mode`);
  });
})();