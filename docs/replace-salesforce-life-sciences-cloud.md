# Move a medical-information register from Salesforce

Checked 20 October 2026. This imports administrative request history from a Salesforce report. It does not transfer the whole Life Sciences Cloud service.

1. Ask your Salesforce administrator for a report on your medical-inquiry records. Include a stable inquiry ID, administrative subject, product label, owner, request type, receipt date, due date, retention review date and protected requester reference. Include the request-evidence reference and original status when available. Exclude patient narratives and clinical details. Those stay in their authorised system.
2. Export the report as **Details Only**, CSV, UTF-8. Salesforce documents this export and the required Export Reports permission in its [report export guide](https://help.salesforce.com/s/articleView?id=sf.reports_export.htm&language=en_US&type=5). Report labels and available fields vary by organisation. The fixture is a fictional configured report, not a claim that every Salesforce export has these headers.
3. Use the column labels below or pass a JSON mapping with --map. Add local due/retention review dates and request classification to the report when absent; do not invent a legal deadline. Convert dates to ISO YYYY-MM-DD. Supported classifications are medical, safety and quality; map your labels explicitly before importing.
4. Run the one-command import as a dry run, reconcile counts and ignored columns, then load it. Review a sample against the original before changing your operating process.

```bash
npm run medical -- import salesforce exports/inquiries.csv --map=exports/columns.json --dry-run --actor="Migration operator"
npm run medical -- import salesforce exports/inquiries.csv --map=exports/columns.json --actor="Migration operator"
```

Default columns:

| Key in mapping | Report column |
|---|---|
| external_id | Inquiry ID |
| subject | Subject |
| product | Product |
| owner | Owner |
| kind | Request Type |
| received | Created Date |
| due | Due Date |
| retention | Retention Review Date |
| requester | Requester Reference |
| evidence | Request Evidence |
| status | Status |

A mapping file overrides only changed labels, for example {"external_id":"Inquiry: ID","subject":"Inquiry Name","product":"Product: Name"}. Supply actual labels from your report, not guessed ones. Header matching ignores case. IDs remain strings. Blank required fields, invalid dates, duplicate IDs and malformed CSV fail before commit. Embedded commas, newlines, quotes and a UTF-8 BOM are supported.

Every row enters as imported, even when Salesforce says Closed or Approved. The original status is preserved separately. No approval, delivery or specialist acknowledgement is inferred. Repeating an identical file skips those IDs. A changed row fails the whole import without overwriting operator work. Reconcile changes explicitly, with a documented migration. Unknown columns are reported and omitted, not copied into hidden payloads.

Sources, attachments, signed requests, response files, review decisions, consent records, user permissions and specialist case details require a separate migration plan. Source references are not their document contents. The free importer does not call Salesforce or require OAuth. A configured report can move in one command after mapping; organisation-specific mapping and evidence reconciliation are part of Enterprise DNA's setup work.

Use activate only for history that must become current work, with reviewed owner, evidence and dates. Export writes all six record types to local JSON. Keep the original export and a protected database backup for reconciliation.
