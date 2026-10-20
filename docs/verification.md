# Verification, 20 October 2026

- Linux, Node 22: npm install, npm test, npm run demo, npm run view and npm run docs passed.
- Linux, Node 20: the same smoke suite passed through npm exec --package=node@20.
- PostgreSQL 18.4: all 31 command tests passed against a disposable local server. The server was stopped after the run. The main dependency set is unchanged.
- PGlite: all 31 command tests passed using temporary storage isolated from business data.
- Tests cover the complete CLI, seed idempotence, migration replay, independent review, expired and withdrawn sources, replacement review, acknowledged specialist handoffs, import dry runs, rollback, repeated files, conflicting records, malformed CSV, invalid dates, ambiguous names, export counts, drafts and escaped HTML.
- Three read-only dashboards and seven fictional paperwork examples rendered. Browser screenshots were inspected and wide request records changed to two-column paperwork.
- The comparison-page gate passed with zero brand errors and sourced vendor prices. Its examples were captured from the seeded CLI, not invented.

## Hosted test limitation

The [manual GitHub Actions run](https://github.com/Enterprise-DNA-OS/medical-information-for-claude-code/actions/runs/39511701719) was refused before any job steps ran. GitHub's annotation says recent account payments failed or the spending limit needs to be increased. Windows execution remains unverified. The workflow retains its Windows/Linux Node 20/22 matrix and PostgreSQL 17 job for an eventual rerun. No claim is made that this hosted run passed.

## Comparison-page browser checks

A focused Astro render used the actual shared page, components, styles and registry. Desktop and 390-pixel mobile screenshots were inspected. All three captured command outputs render as tables, the demo tabs switch, six booking links carry the replacement offer, the robots tag is noindex,nofollow and there is no horizontal page overflow. This is rendering evidence, not proof that the production deployment has completed.
