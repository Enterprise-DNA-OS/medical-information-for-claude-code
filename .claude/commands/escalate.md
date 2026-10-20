---
description: Record a handoff completed through the specialist process
---

Read CLAUDE.md and docs/cli.md. Read the full record before changing it. Use operator-supplied evidence references and identities. Never invent a value or treat a typed actor label as authentication.

```bash
npm run medical -- escalate <inquiry-id> --team="<specialist-team>" --reference="<specialist-case-reference>" --actor="<operator>"
```

Use --json when reading programmatically. Names match case-insensitively and partial IDs work only when unique. An ambiguous name lists candidates and exits 1. Ask which record the operator means.

This records evidence only. It does not contact a specialist or satisfy a reporting duty. Do not delay the existing safety or quality process while using this desk.

Present the result and any missing evidence. Never send, make a clinical decision, delete records or change the specialist reporting system.
