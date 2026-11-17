import { buildApp } from "../../src/app";

export async function buildTestApp() {
  const app = await buildApp();
  await app.ready();
  return app;
}

export const resetDB = async (app: TestApp) => {
  return app.pg.query("TRUNCATE TABLE websites RESTART IDENTITY CASCADE");
};

export type TestApp = Awaited<ReturnType<typeof buildTestApp>>;
