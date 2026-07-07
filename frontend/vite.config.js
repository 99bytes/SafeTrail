import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Standard Vite + React config. Dev server runs on port 5173.
export default defineConfig({
  plugins: [react()],
});
