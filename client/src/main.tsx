
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { logEnvironmentVariables } from "./lib/checkEnvironmentVariables";

// Check environment variables in development mode
if (import.meta.env.DEV) {
  console.log("Checking environment variables...");
  logEnvironmentVariables();
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(<App />);
