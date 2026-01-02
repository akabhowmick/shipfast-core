import { Page } from "@playwright/test";

export async function signUp(page: Page, email: string) {
  await page.goto("/sign-up");
  await page.fill('input[name="identifier"]', email);
  await page.click('button:has-text("Continue")');
  await page.waitForSelector('input[name="password"]', { timeout: 5000 });
  await page.fill('input[name="password"]', "TestPassword123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 10000 });
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.fill('input[name="identifier"]', email);
  await page.click('button:has-text("Continue")');
  await page.waitForSelector('input[name="password"]', { timeout: 5000 });
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 10000 });
}
