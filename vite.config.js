import { defineConfig } from "vite";

export default defineConfig({
  // Ensures assets and modules are bundled correctly
  server: {
    port: 5173,
    open: true, // Automatically opens the browser when you run npm run dev
  },
  build: {
    target: "esnext", // Optimizes the build for modern JavaScript
    outDir: "dist",
  },
});
