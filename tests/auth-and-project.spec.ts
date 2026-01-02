import { test, expect } from "@playwright/test";
import { signUp } from "./helpers";

test.describe("Authentication and Project Creation", () => {
  const testEmail = `test-${Date.now()}@example.com`;

  test("should sign up and create a project", async ({ page }) => {
    // Sign up
    await signUp(page, testEmail);

    // Should be on dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("My Projects");

    // Create a project
    await page.click("text=Create Project");
    await expect(page).toHaveURL("/dashboard/new");

    // Fill in project name
    await page.fill('input[name="name"]', "Test Project");

    // Submit
    await page.click('button[type="submit"]:has-text("Create Project")');

    // Should redirect to project page
    await page.waitForURL(/\/dashboard\/projects\/.*/, { timeout: 10000 });

    // Verify project page loaded
    await expect(page.locator("h1")).toContainText("Test Project");
    await expect(page.locator("text=Status: draft")).toBeVisible();
  });
});
