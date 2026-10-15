# playwright-e2e-saas

A SKILL.md for Claude Code, Cursor, and any agent that follows the
[SKILL.md spec](https://skillmd.dev). Generates complete Playwright E2E tests
from a list of SaaS user flow names.

**Available on [Agensi](https://agensi.io) — $9.99**

---

## What it does

Give the agent your flow names. It reads your router and form components,
then writes:

- `e2e/<flow>.spec.ts` — one file per flow, happy path and main error path
- `e2e/pages/<Page>.ts` — page objects so selectors live in one place
- `e2e/auth.setup.ts` — logs in once, stores session, all authenticated tests reuse it
- patches `playwright.config.ts` if missing the setup project

Selector priority: `data-testid` first, then ARIA role, then visible text.
Never raw CSS classes. If a CSS selector is unavoidable, the agent flags the
component that needs instrumentation.

## Example output

See [`examples/`](./examples/) for a signup spec and a checkout spec showing
the page object pattern and auth setup.

## Install

```bash
# Claude Code
claude skills install plainform/playwright-e2e-saas
```

Or copy `SKILL.md` into your project and reference it in `.claude/SKILLS.md`.

## Usage

```
Cover these flows: signup, invite team member, upgrade plan, cancel subscription
```

The agent reads your project and writes the test files. Then:

```bash
npx playwright install --with-deps
npx playwright test
```

## Self-check

```bash
node test/demo.mjs
```

## License

MIT
