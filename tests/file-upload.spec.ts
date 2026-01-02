import { test, expect } from "@playwright/test";
import { signUp } from "./helpers";
import * as fs from "fs";
import * as path from "path";

test.describe("File Upload", () => {
  const testEmail = `test-${Date.now()}@example.com`;

  test("should upload a file to a project", async ({ page }) => {
    // Sign up and create a project first
    await signUp(page, testEmail);

    await page.click("text=Create Project");
    await page.fill('input[name="name"]', "Upload Test Project");
    await page.click('button[type="submit"]:has-text("Create Project")');

    await page.waitForURL(/\/dashboard\/projects\/.*/);

    // Go to upload page
    await page.click("text=Upload File");
    await expect(page).toHaveURL(/\/dashboard\/projects\/.*\/upload/);

    // Create a test file
    const testFilePath = path.join(__dirname, "test-file.txt");
    fs.writeFileSync(testFilePath, "This is a test file for Playwright");

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Submit upload
    await page.click('button[type="submit"]:has-text("Upload File")');

    // Wait for redirect back to project page
    await page.waitForURL(/\/dashboard\/projects\/[^/]+$/, { timeout: 15000 });

    // Verify file appears
    await expect(page.locator("text=test-file.txt")).toBeVisible();

    // Cleanup
    fs.unlinkSync(testFilePath);
  });
});
