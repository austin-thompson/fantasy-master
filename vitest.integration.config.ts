import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDirectory, "src"),
      "server-only": path.resolve(rootDirectory, "tests/server-only.ts"),
    },
  },
  test: {
    env: {
      BETTER_AUTH_SECRET: "integration-only-secret-at-least-32-characters",
      BETTER_AUTH_URL: "http://localhost:3000",
      LOG_LEVEL: "silent",
    },
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    sequence: {
      concurrent: false,
    },
  },
});
