import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    name: "integration",
    include: ["src/tests/integration/**/*.test.ts"],
    environment: "node",
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
