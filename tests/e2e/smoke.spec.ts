import { expect, test } from "@playwright/test";

test("anonymous access is redirected and application health is reachable", async ({
  page,
  request,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/(login|setup)(\?|$)/);
  await expect(
    page.getByRole("heading", { name: /sign in|create administrator/i }),
  ).toBeVisible();

  if (new URL(page.url()).pathname === "/setup") {
    await page.getByLabel("Username").fill("browser_admin");
    await page.getByLabel("Password").fill("browser-test-password");
    await page.getByRole("button", { name: "Create administrator" }).click();
    await expect(page).toHaveURL("/dashboard");
    await expect(
      page.getByRole("heading", { name: /welcome, browser_admin/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");

    await page.getByLabel("Username").fill("browser_admin");
    await page.getByLabel("Password").fill("browser-test-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");
  }

  const healthResponse = await request.get("/api/health");
  expect(healthResponse.ok()).toBe(true);
  await expect(healthResponse.json()).resolves.toMatchObject({
    status: "ok",
    service: "fantasy-master",
  });
});
