import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force development mode for local development
const isDev = process.env.NODE_ENV !== 'production';
process.env.NODE_ENV = isDev ? 'development' : 'production';
log(`Starting server in ${process.env.NODE_ENV} mode`);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Development-optimized headers
if (isDev) {
  app.use((req, res, next) => {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    next();
  });
}

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://trackedfr.com',
    'https://www.trackedfr.com'
  ];

  // Only add development URLs in non-production environment
  if (isDev) {
    allowedOrigins.push('http://localhost:5000', 'http://localhost:3000');
  }

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, firebase-uid, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    // Add security headers for production only
    if (!isDev) {
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

// Enhanced debug logging
app.use((req, res, next) => {
  log(`${process.env.NODE_ENV} :: ${req.method} ${req.path}`);
  next();
});

(async () => {
  const server = registerRoutes(app);

  // Production-optimized error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = isDev ? (err.message || 'Internal Server Error') : 'Internal Server Error';
    res.status(status).json({ message });
    console.error(err);
  });

  if (isDev) {
    await setupVite(app, server);
  } else {
    const publicPath = path.resolve(__dirname, "public");
    log(`Serving static files from: ${publicPath}`);

    if (!fs.existsSync(publicPath)) {
      throw new Error(
        `Could not find the build directory: ${publicPath}, make sure to build the client first`,
      );
    }

    // Production-optimized static file serving
    app.use(express.static(publicPath, {
      maxAge: '30d',
      etag: true,
      lastModified: true,
      immutable: true,
    }));

    // Enhanced SPA fallback with logging
    app.get('/*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        log(`API request: ${req.path}`);
        next();
      } else {
        log(`Serving SPA for client route: ${req.path}`);
        res.sendFile(path.join(publicPath, 'index.html'), {
          maxAge: '0',
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