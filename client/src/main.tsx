import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force reload and clear cache
const forceReload = () => {
  console.log('Development mode detected, clearing caches...');
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        console.log('Clearing cache:', name);
        caches.delete(name);
      });
    });
  }

  // Add timestamp to prevent browser caching
  const timestamp = Date.now();
  console.log('Adding timestamp to prevent caching:', timestamp);

  // Force module reloading by adding a dynamic import
  const moduleUrl = `/@vite/client?t=${timestamp}`;
  import(moduleUrl).catch(err => {
    console.log('Module reload attempted:', moduleUrl);
    console.error('Module reload error (expected):', err);
  });

  // Add meta tag to prevent caching
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Cache-Control';
  meta.content = 'no-cache, no-store, must-revalidate';
  document.head.appendChild(meta);
};

// Force reload in development
if (import.meta.env.DEV) {
  console.log('Starting application in development mode');
  forceReload();
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(<App />);