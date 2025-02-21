import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force development mode and disable all caching
const isDev = true; // Force development mode
process.env.NODE_ENV = 'development';
log(`Starting server in ${process.env.NODE_ENV} mode with timestamp ${Date.now()}`);

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

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://trackedfr.com',
    'https://www.trackedfr.com',
    'http://localhost:5000',
    'http://localhost:3000'
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, firebase-uid, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Enhanced debug logging
app.use((req, res, next) => {
  log(`${process.env.NODE_ENV} :: ${req.method} ${req.path} :: ${Date.now()}`);
  next();
});

(async () => {
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


  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port} in ${process.env.NODE_ENV} mode at ${Date.now()}`);
  });
})();