import { test, expect } from "@playwright/test";
import { signUp } from "./helpers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test.describe("Admin Access", () => {
  test("non-admin user cannot access admin dashboard", async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;

    // Sign up as regular user
    await signUp(page, testEmail);

    // Try to access admin page
    await page.goto("/admin");

    // Should be redirected to dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("text=Admin Dashboard")).not.toBeVisible();
  });

  test("admin user can access admin dashboard", async ({ page }) => {
    const adminEmail = `admin-${Date.now()}@example.com`;

    // Sign up
    await signUp(page, adminEmail);

    // Get the user's Clerk ID and make them admin in database
    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "admin" },
      });
    }

    // Go to admin page
    await page.goto("/admin");

    // Should see admin dashboard
    await expect(page).toHaveURL("/admin");
    await expect(page.locator("h1")).toContainText("Admin Dashboard");
    await expect(page.locator("text=Total Users")).toBeVisible();
    await expect(page.locator("text=Total Projects")).toBeVisible();
  });
});
