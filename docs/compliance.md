# Record checks and their limits

Sources checked 20 October 2026. These checks support administrative evidence review. They do not certify compliance, validate a medical response, determine reportability or replace the sponsor's specialist systems.

## REQUEST_EVIDENCE and SOURCE

[Medicines Australia, section 7](https://code.medicinesaustralia.com.au/code/part-b-ethical-interactions-with-healthcare-professionals/section-7-scientific-exchange/) distinguishes scientific exchange from promotion. The desk records request evidence and versioned source references so a qualified reviewer can inspect the basis of a response. It does not decide whether the exchange meets that code.

Local controls require a request reference, a source for the same product, a current source review date and an independent reviewer label. SOURCE flags expired or withdrawn source references attached to approved replies. The CLI blocks submission, approval, recording and closure against an invalid source. These are local workflow controls, not a rule that every document legally expires after a particular number of days. The demo's dates are examples.

## HANDOFF

[Medsafe industry guidance](https://www.medsafe.govt.nz/regulatory/adverse-reaction-reporting-for-medicines.asp) assigns adverse-reaction reporting duties to sponsors and describes receipt-based timeframes. This desk deliberately does not calculate those deadlines, assess severity or report a case. The existing pharmacovigilance process must receive the concern immediately under the sponsor's procedure. The desk stores only the external case reference and acknowledgement, never the adverse-event narrative. HANDOFF flags missing acknowledgements for operator-classified safety or quality requests. It cannot detect an unflagged concern in text. Administrative closure is not specialist case closure.

## RETENTION

[New Zealand privacy principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits retention to what is needed for a lawful purpose. The responsible business supplies the retention review date considering applicable record duties and holds. RETENTION flags a review date; it does not delete anything. There is no universal retention period in this software. Review generated HTML, drafts, exports and backups as part of any disposal decision. Requester references may still identify a person and need protection.

## IMPORT_REVIEW

Imported statuses never confer current approval or closure. Reconcile the report and supporting evidence before activation. The import preserves the vendor status as history and does not import signed approvals or controlled documents.

## Access boundary

The CLI is an operator tool. Actor and reviewer labels are not authenticated identities or electronic signatures. Row-level security is enabled without public policies; use a dedicated database owner connection, never expose that connection to a browser. Shared use requires authentication, access controls, protected evidence storage and backups. The record log is append-only through the CLI but the database owner can alter it, so it is not tamper-proof. Medical advice, regulatory submissions and clinical information stay in the existing authorised systems.
