import { test, expect } from '@playwright/test';
import { SignupPage } from './pages/SignupPage';

test.describe('Signup flow', () => {
  test('creates account with valid credentials', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();
    await signup.fill({ email: 'new@example.com', password: 'Valid1234!' });
    await signup.submit();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId('welcome-banner')).toBeVisible();
  });

  test('shows error on duplicate email', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();
    await signup.fill({ email: 'existing@example.com', password: 'Valid1234!' });
    await signup.submit();
    await expect(page.getByTestId('field-error-email')).toContainText('already registered');
  });

  test('shows error on weak password', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();
    await signup.fill({ email: 'new@example.com', password: '123' });
    await signup.submit();
    await expect(page.getByTestId('field-error-password')).toBeVisible();
  });

  test.afterEach(async ({}, testInfo) => {
    console.log(`${testInfo.title}: ${testInfo.status}`);
  });
});
