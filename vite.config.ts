import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function serveBackendData() {
  const handler = (req, res, next) => {
    const url = req.url?.split("?")[0] || "";
    if (!url.startsWith("/backend/data/")) {
      next();
      return;
    }

    const filePath = path.resolve(__dirname, `.${url}`);
    const allowedRoot = path.resolve(__dirname, "backend", "data");

    if (!filePath.startsWith(allowedRoot)) {
      res.statusCode = 403;
      res.end("Forbidden");
      return;
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    fs.createReadStream(filePath).pipe(res);
  };

  return {
    name: "serve-backend-data",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

export default defineConfig({
  root: "frontend",
  base: "/",
  plugins: [react(), serveBackendData()],
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
      input: path.resolve(__dirname, "frontend/index.html")
    }
  }
});