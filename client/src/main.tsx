import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force development mode and disable caching in development
if (import.meta.env.DEV) {
  // Clear any existing cache
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(<App />);