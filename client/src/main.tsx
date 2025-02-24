import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Development mode cache clearing
if (import.meta.env.DEV) {
  console.log('🚀 Development mode detected');
  console.log('📅 Timestamp:', new Date().toISOString());

  // Clear caches in development
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        console.log('🗑️ Clearing cache:', name);
        caches.delete(name);
      });
    });
  }

  // Add meta tag to prevent caching
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Cache-Control';
  meta.content = 'no-cache, no-store, must-revalidate';
  document.head.appendChild(meta);
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(<App />);