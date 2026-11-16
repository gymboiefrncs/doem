import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    projects: [
      { extends: true, test: { name: "unit", include: ["test/website/**/*.unit.test.ts"] } },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["test/website/**/*.integration.test.ts"]
        }
      },
      {
        extends: true,
        test: {
          name: "api",
          include: ["test/website/**/*.api.test.ts"]
        }
      }
    ]
  }
});
