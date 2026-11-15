import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "backend",
    environment: "node",
    globals: true,
    include: ["test/**/*.{test,spec}.ts"],

    fileParallelism: false,

    clearMocks: true,
    restoreMocks: true,

    setupFiles: ["./vitest.setup.ts"]
  }
});
