# CLI reference

Every command supports --json. Flags use --name=value. Unknown flags fail. Dates are ISO YYYY-MM-DD. Product names and request subjects are case-insensitive exact matches; UUID prefixes must be unique. An ambiguity lists matching IDs and exits 1. All changes require --actor. Actor labels are audit metadata, not authenticated identities.

Do not enter patient names, clinical narratives, adverse-event details or diagnoses. Store a protected reference to those records in their authorised system. Request classification is supplied by the responsible operator. No automated content triage runs here.

Medical workflow: add-inquiry, submit-review, approve-review, record-response, close. A rejected review returns to open. The preparer and reviewer labels must differ. Source product and validity are checked at submission, approval, response recording and closure. A new source version is a new record. Withdraw a bad source, do not overwrite history. Use revise-response to return an undelivered ready request to open, then submit and review a replacement. Prior review evidence remains in history. Delivered responses cannot be revised through this command.

Safety and quality workflow: use the existing specialist process immediately, then record it with escalate and acknowledge-handoff. Close only when every recorded handoff has an acknowledgement. Closure is administrative and never means a safety case is resolved. No sends occur.

Due dates, source review dates and retention review dates are local policy inputs, not calculated legal deadlines. Database dates use UTC. Put real histories in a fresh database; npm run demo is fictional data.

### products

Read the product register.

```bash
npm run medical -- products
```

### sources

Read controlled source references and versions.

```bash
npm run medical -- sources
```

### inquiries

Read the request register.

```bash
npm run medical -- inquiries
```

### inquiry

Read a request, its reviews, handoffs and history.

```bash
npm run medical -- inquiry "<id-or-subject>"
```

### triage

Triage the open request queue.

```bash
npm run medical -- triage
```

### due-replies

Review replies due this week.

```bash
npm run medical -- due-replies
```

### source-review

Review expired, withdrawn and soon-expiring sources.

```bash
npm run medical -- source-review
```

### escalations

Reconcile specialist handoffs.

```bash
npm run medical -- escalations
```

### attention

Find overdue work and evidence gaps.

```bash
npm run medical -- attention
```

### compliance

Review record checks and their cited limits.

```bash
npm run medical -- compliance
```

### retention-review

Review records due for a retention decision.

```bash
npm run medical -- retention-review
```

### activity

Read the event history.

```bash
npm run medical -- activity
```

### insights

Answer ten cross-record questions.

```bash
npm run medical -- insights
```

### add-product

Add a product reference.

```bash
npm run medical -- add-product --name="<name>" --actor="<operator>"
```

### add-source

Record an approved controlled source.

```bash
npm run medical -- add-source --product="<product>" --title="<title>" --version="<version>" --reference="<controlled-reference>" --approver="<reviewer>" --evidence="<approval-reference>" --valid-until=<YYYY-MM-DD> --actor="<operator>"
```

### withdraw-source

Withdraw a source after the responsible reviewer decides.

```bash
npm run medical -- withdraw-source <source-id> --evidence="<decision-reference>" --actor="<operator>"
```

### add-inquiry

Register an administrative request.

```bash
npm run medical -- add-inquiry --product="<product>" --subject="<administrative-label>" --requester="<protected-reference>" --evidence="<request-reference>" --owner="<owner>" --kind=<medical|safety|quality> --received=<YYYY-MM-DD> --due=<YYYY-MM-DD> --retention=<YYYY-MM-DD> --actor="<operator>"
```

### assign

Assign an active request.

```bash
npm run medical -- assign <inquiry-id> --owner="<owner>" --actor="<operator>"
```

### activate

Reconcile imported history into an active request.

```bash
npm run medical -- activate <inquiry-id> --owner="<owner>" --evidence="<reconciliation-reference>" --due=<YYYY-MM-DD> --retention=<YYYY-MM-DD> --actor="<operator>"
```

### submit-review

Submit a prepared response reference for independent review.

```bash
npm run medical -- submit-review <inquiry-id> --source=<source-id> --response="<controlled-response-reference>" --actor="<preparer>"
```

### approve-review

Record an independent reviewer decision.

```bash
npm run medical -- approve-review <review-id> --decision=<approved|rejected> --evidence="<review-reference>" --actor="<reviewer>"
```

### record-response

Record evidence that a reviewed response was delivered externally.

```bash
npm run medical -- record-response <inquiry-id> --evidence="<delivery-reference>" --actor="<operator>"
```

### escalate

Record a handoff completed through the specialist process.

```bash
npm run medical -- escalate <inquiry-id> --team="<specialist-team>" --reference="<specialist-case-reference>" --actor="<operator>"
```

### acknowledge-handoff

Record the specialist acknowledgement.

```bash
npm run medical -- acknowledge-handoff <handoff-id> --evidence="<receipt-reference>" --actor="<acknowledging-person>"
```

### close

Close administrative work after evidence checks.

```bash
npm run medical -- close <inquiry-id> --evidence="<closure-reference>" --actor="<operator>"
```

### log

Log a follow-up reference.

```bash
npm run medical -- log <inquiry-id> --reference="<follow-up-reference>" --actor="<operator>"
```

### import

Bring in a Salesforce Details Only report.

```bash
npm run medical -- import salesforce <report.csv> --dry-run --actor="<operator>"
```

### export

Export all records to a protected local JSON file.

```bash
npm run medical -- export --file="<protected-output.json>"
```

### weekly-review

Draft the Monday medical desk handover.

```bash
npm run medical -- weekly-review
```

### draft-response

Draft an internal response cover sheet without a medical answer.

```bash
npm run medical -- draft-response <inquiry-id>
```

### revise-response

Return an undelivered ready medical response to open for a fresh review.

```bash
npm run medical -- revise-response <inquiry-id> --evidence="<reason-reference>" --actor="<operator>"
```
