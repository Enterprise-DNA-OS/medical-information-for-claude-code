# Medical Information for Claude Code

An administrative desk for a medical-information coordinator. The database holds request labels, product references, owners, dates, approved-source references, review evidence and specialist acknowledgements. It contains no medical-answer engine.

## Working rules

- Read records through the CLI before responding. Never invent a record, output or evidence reference.
- Never store clinical narratives, patient details, diagnoses or adverse-event payloads. Use references to their protected systems.
- Never write medical answers, assess causality, classify reportability, set regulatory deadlines or submit a report. Responsible specialists own these decisions.
- Nothing sends. Drafts are internal cover sheets and handovers under drafts/.
- Independent reviewer labels must differ from preparer labels. Labels are not authentication. A shared installation needs controlled access and verified identities.
- Never infer approval from imported status. Imported rows remain historical until explicitly reconciled.
- Never delete records or change a safety gate without explicit authority. Retention review flags records; disposal requires a scoped decision covering exports and backups.
- Keep migrations immutable. Change the model with /customise, run tests, then show the result.

## Routes

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
- /documents: render internal paperwork with npm run docs.
- /view: render read-only dashboards with npm run view.
- /new-view: add a read-only view.
- /customise: add fields or adapt local policy with a migration.

## Files and commands

scripts/medical.mjs is the CLI. docs/cli.md is its complete syntax. supabase/migrations holds the model, supabase/seed.sql is fictional demonstration data. scripts/lib/db.mjs selects a dedicated PostgreSQL DATABASE_URL or local PGlite DATA_DIR. brand.json sets the paperwork identity. views.json and documents.json declare read-only outputs. Never commit credentials, .data, drafts, exports or rendered business records.

npm install, npm test and npm run demo are the verification path. Tests use a temporary database; TEST_DATABASE_URL is for a disposable PostgreSQL CI database only. Node 20 and 22, Windows and Linux are in the manual CI matrix.

Built by Enterprise DNA. Omni by Enterprise DNA installs, customises and operates the business version for a setup fee and retainer.
