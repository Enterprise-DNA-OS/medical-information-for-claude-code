---
description: Add a product reference
---

Read CLAUDE.md and docs/cli.md. Read the full record before changing it. Use operator-supplied evidence references and identities. Never invent a value or treat a typed actor label as authentication.

```bash
npm run medical -- add-product --name="<name>" --actor="<operator>"
```

Use --json when reading programmatically. Names match case-insensitively and partial IDs work only when unique. An ambiguous name lists candidates and exits 1. Ask which record the operator means.



Present the result and any missing evidence. Never send, make a clinical decision, delete records or change the specialist reporting system.
