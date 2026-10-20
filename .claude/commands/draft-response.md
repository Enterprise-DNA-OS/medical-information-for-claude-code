---
description: Draft an internal response cover sheet without a medical answer
---

Read CLAUDE.md and docs/cli.md. Read the full record before changing it. Use operator-supplied evidence references and identities. Never invent a value or treat a typed actor label as authentication.

```bash
npm run medical -- draft-response <inquiry-id>
```

Use --json when reading programmatically. Names match case-insensitively and partial IDs work only when unique. An ambiguous name lists candidates and exits 1. Ask which record the operator means.

The output is an internal cover sheet only. Never generate, paraphrase or send medical advice. The qualified reviewer prepares clinical content in the controlled system.

Present the result and any missing evidence. Never send, make a clinical decision, delete records or change the specialist reporting system.
