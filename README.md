# Medical Information for Claude Code

The open-source medical-information desk that is just a database and Claude Code. Built by Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. [Quick start](#quick-start). | Your fields, rules and Salesforce history. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=salesforce-life-sciences-cloud). | Installed and operated through Omni by Enterprise DNA. Setup fee, then a retainer. [How it works](https://enterprisedna.co/omni/instead-of/salesforce-life-sciences-cloud?utm_source=github&utm_medium=readme&utm_campaign=salesforce-life-sciences-cloud). |

## What it holds

A medical-information coordinator's administrative record: request labels, product references, owners, dates, approved-source versions, response review references and specialist handoff acknowledgements. Clinical answers and safety reporting stay with the responsible specialists and their controlled systems. This is a scoped desk, not a replacement for the whole Life Sciences Cloud suite.

Salesforce lists Core at US$350 per user/month and Customer Engagement at US$150 per user/month. At 25 users, those rates imply US$150,000 annually. This is a list-price scenario, not a customer invoice or savings promise. [Vendor pricing](https://www.salesforce.com/life-sciences/cloud/pricing/), checked 20 October 2026.

## Quick start

```bash
git clone https://github.com/Enterprise-DNA-OS/medical-information-for-claude-code.git
cd medical-information-for-claude-code
npm install
npm test
npm run demo
npm run view
npm run docs
```

Node 20 or later. PGlite runs locally without a server. DATABASE_URL selects a dedicated PostgreSQL database; DATA_DIR selects local storage. Demo data is fictional, including products, source references and requesters. Use a fresh database for business records. Keep generated files and database backups private.

## Five weekly rituals

Triage new requests, chase due replies, review source expiry, reconcile specialist handoffs, and write the Monday handover. The last reads due-replies, attention and compliance and drafts the results locally.

## Commands

31 CLI commands and 35 slash recipes. Full syntax: [docs/cli.md](docs/cli.md).

- /products: Read the product register.
- /sources: Read controlled source references and versions.
- /inquiries: Read the request register.
- /inquiry: Read a request, its reviews, handoffs and history.
- /triage: Triage the open request queue.
- /due-replies: Review replies due this week.
- /source-review: Review expired, withdrawn and soon-expiring sources.
- /escalations: Reconcile specialist handoffs.
- /attention: Find overdue work and evidence gaps.
- /compliance: Review record checks and their cited limits.
- /retention-review: Review records due for a retention decision.
- /activity: Read the event history.
- /insights: Answer ten cross-record questions.
- /add-product: Add a product reference.
- /add-source: Record an approved controlled source.
- /withdraw-source: Withdraw a source after the responsible reviewer decides.
- /add-inquiry: Register an administrative request.
- /assign: Assign an active request.
- /activate: Reconcile imported history into an active request.
- /submit-review: Submit a prepared response reference for independent review.
- /approve-review: Record an independent reviewer decision.
- /revise-response: Return an undelivered ready response for a new review.
- /record-response: Record evidence that a reviewed response was delivered externally.
- /escalate: Record a handoff completed through the specialist process.
- /acknowledge-handoff: Record the specialist acknowledgement.
- /close: Close administrative work after evidence checks.
- /log: Log a follow-up reference.
- /import: Bring in a Salesforce Details Only report.
- /export: Export all records to a protected local JSON file.
- /weekly-review: Draft the Monday medical desk handover.
- /draft-response: Draft an internal response cover sheet without a medical answer.
- /documents: render request cover sheets, handoff records and retention worksheets.
- /view: render the week, handoffs and evidence dashboards.
- /new-view: add a read-only view in plain language.
- /customise: add a field, rename a stage or adapt a local policy with a migration.

## Ten questions your desk answers today

These cross-record questions run through /insights. They do not imply that Salesforce cannot be configured to answer them.

1. Which owners have overdue medical replies?
2. Which products have unanswered requests with missing request evidence?
3. Which source versions expire in the next month with linked requests?
4. Which approved replies refer to an expired or withdrawn source?
5. Which specialist handoffs still lack an acknowledgement?
6. Which products generate both medical and specialist work?
7. Which closed records have reached their retention review date?
8. Which requests are ready but have no recorded response?
9. How much imported history awaits reconciliation by source status?
10. Which owners carry work across more than one product?

## Your first hour: ten things to ask for

1. Put our name and logo on the paperwork.
2. Add our product register.
3. Bring in a mapped Salesforce report with a dry run.
4. Show which imported histories need reconciliation.
5. List overdue requests by owner.
6. Record the current approved source references.
7. Prepare a response cover sheet for specialist review.
8. Reconcile specialist handoff acknowledgements.
9. Add our business-unit field with /customise.
10. Build a product-specific weekly view with /new-view.

## Switch from Salesforce

Export a configured inquiry report as Details Only CSV, then run one import command. The import supports mapped column labels, validates the complete file, rolls back on conflict and skips identical records. History stays imported until reconciled; Closed in Salesforce does not create a local approval. Attachments, signed approvals, permissions and specialist case files need a separate migration plan. [Switching guide](docs/replace-salesforce-life-sciences-cloud.md).

## Evidence, documents and views

Local checks enforce independent reviewer labels, matching product sources, valid source dates and acknowledged specialist handoffs. /compliance shows missing request evidence, source problems and retention reviews. [Sources and limits](docs/compliance.md).

npm run docs produces branded internal request cover sheets, handoff records and retention worksheets. npm run view produces three read-only dashboards. brand.json controls business name, logo and colours. These are administrative records, not medical answers or regulatory filings. The protected document system holds the actual source documents and replies. Actor labels are not authenticated identities or electronic signatures. The CLI does not detect adverse events in text.

## Why no front end

The coordinator can run the register through an assistant and read local HTML snapshots. Mobile capture, authenticated collaboration, signatures and connected delivery require a scoped implementation. [The boundary](docs/why-no-front-end.md).

## Verification

npm test uses temporary local storage and exercises all 31 commands, imports, workflow gates, source withdrawal, exports and rendered documents. The manual CI matrix covers Node 20 and 22 on Windows and Linux, plus PostgreSQL 17. Check the actual run result before claiming a platform passed.

## Installed and operated for your business

Omni by Enterprise DNA maps your history, builds your fields and review rules, adds the access controls and screens you need, and runs your version. A different stack can be scoped. One setup fee, then a retainer. Your qualified team retains clinical and regulatory responsibilities.

[Book Sam's 30-minute call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=salesforce-life-sciences-cloud).

## License

MIT. Copyright 2026 Enterprise DNA. Salesforce is its owner's trademark. This independent project is not affiliated with Salesforce.
