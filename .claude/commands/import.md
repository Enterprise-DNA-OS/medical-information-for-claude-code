---
description: Bring in a Salesforce Details Only report
---

Read CLAUDE.md and docs/cli.md. Read the full record before changing it. Use operator-supplied evidence references and identities. Never invent a value or treat a typed actor label as authentication.

```bash
npm run medical -- import salesforce <report.csv> --dry-run --actor="<operator>"
```

Use --json when reading programmatically. Names match case-insensitively and partial IDs work only when unique. An ambiguous name lists candidates and exits 1. Ask which record the operator means.

Read `docs/replace-salesforce-life-sciences-cloud.md`. Review ignored columns and row counts. After the operator has confirmed the mapping, remove `--dry-run` to load historical records. Do not infer approval from a source status.

Present the result and any missing evidence. Never send, make a clinical decision, delete records or change the specialist reporting system.
