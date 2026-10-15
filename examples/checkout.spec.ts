import { test, expect } from '@playwright/test';
import { CheckoutPage } from './pages/CheckoutPage';

// Requires auth: this project depends on the 'setup' project in playwright.config.ts
test.use({ storageState: '.auth/user.json' });

test.describe('Checkout / upgrade plan', () => {
  test('upgrades from free to pro plan', async ({ page }) => {
    const checkout = new CheckoutPage(page);
    await checkout.goto();
    await checkout.selectPlan('pro');
    // Stripe test mode: use test card 4242 4242 4242 4242
    await checkout.fillCard({ number: '4242424242424242', exp: '12/28', cvc: '123' });
    await checkout.confirm();
    await expect(page).toHaveURL(/\/settings\/billing/);
    await expect(page.getByTestId('plan-badge')).toContainText('Pro');
  });

  test('shows error on declined card', async ({ page }) => {
    const checkout = new CheckoutPage(page);
    await checkout.goto();
    await checkout.selectPlan('pro');
    // Stripe test card for decline
    await checkout.fillCard({ number: '4000000000000002', exp: '12/28', cvc: '123' });
    await checkout.confirm();
    await expect(page.getByTestId('payment-error')).toContainText('declined');
  });

  test.afterEach(async ({}, testInfo) => {
    console.log(`${testInfo.title}: ${testInfo.status}`);
  });
});
