import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "node",
      globals: true,
      include: ["src/lib/__tests__/**/*.spec.ts"]
    }
  })
);
