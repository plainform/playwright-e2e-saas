// Self-check: verifies SKILL.md has the required structure.
// Run with: node test/demo.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const skill = readFileSync(join(dir, '..', 'SKILL.md'), 'utf8');

const required = [
  ['frontmatter name',        /^name:\s+playwright-e2e-saas/m],
  ['frontmatter description', /^description:/m],
  ['selector strategy table', /data-testid/],
  ['auth setup section',      /storageState/],
  ['page object format',      /class \w+Page/],
  ['limit section',           /The limit/],
];

let pass = true;
for (const [label, re] of required) {
  if (re.test(skill)) {
    console.log(`ok  ${label}`);
  } else {
    console.error(`FAIL  ${label}  (pattern: ${re})`);
    pass = false;
  }
}

if (!pass) process.exit(1);
console.log('\nSKILL.md structure ok');
