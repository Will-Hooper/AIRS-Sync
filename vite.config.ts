import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "frontend",
  publicDir: path.resolve(__dirname, "public"),
  base: "/",
  plugins: [react()],
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "frontend/index.html"),
        "m/index": path.resolve(__dirname, "frontend/m/index.html")
      }
    }
  }
});
