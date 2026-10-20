---
description: Draft the Monday medical desk handover
---

Read CLAUDE.md and docs/cli.md. Read the full record before changing it. Use operator-supplied evidence references and identities. Never invent a value or treat a typed actor label as authentication.

```bash
npm run medical -- weekly-review
```

Use --json when reading programmatically. Names match case-insensitively and partial IDs work only when unique. An ambiguous name lists candidates and exits 1. Ask which record the operator means.

The command reads due-replies, attention and compliance and writes drafts/weekly-review.md. Read the draft, group by owner, and return the file. Nothing sends.

Present the result and any missing evidence. Never send, make a clinical decision, delete records or change the specialist reporting system.
