---
name: playwright-e2e-saas
description: Generate complete Playwright E2E tests from a list of SaaS user flow names. Use when the team knows which flows are critical (signup, onboarding, checkout, invite, password reset, plan upgrade) but has not written the tests yet. Reads the project router and form components, produces .spec.ts files with page objects, resilient selectors, and a shared auth setup. Each generated test is runnable on a fresh Playwright install.
---

# Playwright E2E Generator for SaaS

## What it does

Takes a list of user flow names and turns them into runnable Playwright tests
for a SaaS application. Each generated file:

- uses **page objects** — selectors live in one place, not scattered across specs
- picks **`data-testid` first**, then ARIA role, then visible text, never raw CSS classes
- handles **auth once** via `storageState`, not per-test logins
- covers the **happy path** and the **most common error path** for each flow
- is isolated: each test starts clean, does not depend on another test's state

## How to run it

1. Give Claude the flows you want covered. No other prep needed.

   ```
   Cover these flows: signup, invite team member, upgrade plan, cancel subscription
   ```

2. Claude reads the project. Point it at the repo root. It looks at:
   - router config (`routes.ts`, `pages/`, `app/` in Next.js, `router/index.ts` in Vue)
   - form components for each named flow
   - API route handlers (to understand success states and error codes)
   - existing E2E tests, if any — to match local conventions

   Three files is enough for most flows. Claude does not scan the whole codebase.

3. Claude writes the output:
   - `e2e/<flow>.spec.ts` — one file per flow, happy path + error path
   - `e2e/pages/<Page>.ts` — page objects shared across specs
   - `e2e/auth.setup.ts` — logs in once, saves `storageState` to `.auth/user.json`
   - `playwright.config.ts` — created if missing; patched if it exists and is missing the setup project

4. Run and verify:

   ```bash
   npx playwright install --with-deps
   npx playwright test
   ```

## Selector strategy — follow this order, no exceptions

| Priority | Selector | When to use |
|---|---|---|
| 1 | `data-testid="submit-signup"` | always first |
| 2 | `getByRole('button', { name: 'Create account' })` | when `data-testid` is absent |
| 3 | `getByLabel('Email')` / `getByText('Signed in')` | stable copy that won't change |
| 4 | CSS class | last resort only — add a `// FRAGILE:` comment naming the component that needs a `data-testid` |

If writing a selector requires a CSS class, insert the comment and tell the
user which component to instrument before merging the test.

## Auth setup

For any flow that needs a logged-in user:

- Write `e2e/auth.setup.ts` that calls the login form once, waits for the
  dashboard URL, and calls `page.context().storageState({ path: '.auth/user.json' })`
- In `playwright.config.ts`, add a `setup` project that depends on `auth.setup.ts`
  and make authenticated spec projects depend on it
- Never repeat the login inside individual spec files — it doubles the run time
  and serialises tests that could run in parallel

Multiple roles (admin / member / viewer): one `storageState` file per role,
one setup test per role, parameterise the spec that needs both.

## Output format for each spec file

```typescript
import { test, expect } from '@playwright/test';
import { SignupPage } from './pages/SignupPage';

test.describe('Signup flow', () => {
  test('creates account with valid credentials', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();
    await signup.fill({ email: 'test@example.com', password: 'Valid1234!' });
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

  test.afterEach(async ({}, testInfo) => {
    console.log(`${testInfo.title}: ${testInfo.status}`);
  });
});
```

Each spec must include:
- one `test` for the happy path
- one `test` for the most common error path (duplicate, invalid input, permission denied)
- `expect` assertions on both **URL change** and a **visible UI element** confirming success
- `test.afterEach` logging title and status (aids debugging CI failures)

## Page object format

```typescript
import { Page, Locator } from '@playwright/test';

export class SignupPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput    = page.getByTestId('input-email');
    this.passwordInput = page.getByTestId('input-password');
    this.submitButton  = page.getByTestId('submit-signup');
  }

  async goto() {
    await this.page.goto('/signup');
  }

  async fill({ email, password }: { email: string; password: string }) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }
}
```

## The limit, state it every time

**E2E tests cover the outside, not the inside.** This skill generates the
first layer: happy path and the most common error path. It does not cover:

- unit logic or edge cases inside a function
- timing bugs or race conditions under load
- third-party integrations (Stripe, OAuth) — use their test mode credentials
  and stub only what their sandbox cannot simulate
- accessibility — pair with `eaa-audit` for that

When you finish, tell the user which flows still need manual test-data setup
(seeded rows, S3 objects, email-verification tokens, etc.) before the tests
can run green in CI.

## When NOT to use this skill

- Unit or integration tests — use your test runner directly
- Projects without a web UI
- Running or debugging existing tests — just run them
- Projects where you cannot read the source (no repo access)
