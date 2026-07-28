import { expect, test } from "@playwright/test";

test("login placeholder and application health are reachable", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  const healthResponse = await request.get("/api/health");
  expect(healthResponse.ok()).toBe(true);
  await expect(healthResponse.json()).resolves.toMatchObject({
    status: "ok",
    service: "fantasy-master",
  });
});
