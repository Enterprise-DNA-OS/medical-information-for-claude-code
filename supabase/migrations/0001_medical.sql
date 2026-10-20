CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TABLE products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(trim(name))>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX products_name ON products(lower(name));
CREATE TABLE sources (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id),
 title text NOT NULL, version text NOT NULL, reference text NOT NULL, approver text NOT NULL,
 approval_evidence text NOT NULL, valid_until date NOT NULL, withdrawn boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(product_id,title,version)
);
CREATE TABLE inquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), external_id text UNIQUE, import_hash text,
 product_id uuid NOT NULL REFERENCES products(id), subject text NOT NULL,
 requester_ref text NOT NULL, request_evidence text NOT NULL DEFAULT '', owner text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('medical','safety','quality')),
 state text NOT NULL DEFAULT 'open' CHECK(state IN ('imported','open','review','ready','closed')),
 source_status text, received_on date NOT NULL DEFAULT current_date, due_on date NOT NULL,
 retention_on date NOT NULL, response_ref text, response_on date,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(due_on>=received_on), CHECK(retention_on>=received_on)
);
CREATE TABLE reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), inquiry_id uuid NOT NULL REFERENCES inquiries(id),
 source_id uuid NOT NULL REFERENCES sources(id), preparer text NOT NULL, response_ref text NOT NULL,
 reviewer text, decision text NOT NULL DEFAULT 'pending' CHECK(decision IN ('pending','approved','rejected')),
 evidence text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(decision='pending' OR (length(trim(reviewer))>0 AND length(trim(evidence))>0 AND lower(reviewer)<>lower(preparer)))
);
CREATE TABLE handoffs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), inquiry_id uuid NOT NULL REFERENCES inquiries(id),
 team text NOT NULL, reference text NOT NULL, actor text NOT NULL, acknowledged_by text,
 acknowledgement_ref text, acknowledged_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), inquiry_id uuid REFERENCES inquiries(id),
 action text NOT NULL, actor text NOT NULL, reference text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['products','sources','inquiries','reviews','handoffs','events'] LOOP
 EXECUTE format('CREATE TRIGGER touch BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()',t);
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
END LOOP; END $$;
CREATE VIEW inquiry_desk AS
 SELECT i.id,i.subject,p.name AS product,i.kind,i.state,i.owner,i.received_on,i.due_on,
 current_date-i.due_on AS days_late,i.requester_ref,i.request_evidence,i.retention_on,i.response_ref
 FROM inquiries i JOIN products p ON p.id=i.product_id;
CREATE VIEW due_replies AS SELECT * FROM inquiry_desk
 WHERE state NOT IN ('closed','imported') AND kind='medical' AND due_on<=current_date+7;
CREATE VIEW source_review AS SELECT s.id,p.name AS product,s.title,s.version,s.valid_until,s.withdrawn,
 count(DISTINCT r.inquiry_id) AS linked_inquiries FROM sources s JOIN products p ON p.id=s.product_id
 LEFT JOIN reviews r ON r.source_id=s.id
 WHERE s.withdrawn OR s.valid_until<=current_date+30
 GROUP BY s.id,p.name,s.title,s.version,s.valid_until,s.withdrawn;
CREATE VIEW escalation_desk AS SELECT i.id,i.subject,i.kind,i.owner,i.state,
 h.id AS handoff_id,h.team,h.reference,h.acknowledged_by,h.acknowledgement_ref
 FROM inquiries i LEFT JOIN handoffs h ON h.inquiry_id=i.id
 WHERE i.kind IN ('safety','quality') AND i.state<>'closed';
CREATE VIEW compliance_findings AS
 SELECT i.id,i.subject,'REQUEST_EVIDENCE' AS rule,'Request evidence missing' AS issue FROM inquiries i
 WHERE i.request_evidence='' AND i.state<>'imported'
 UNION ALL SELECT i.id,i.subject,'RETENTION','Retention review date reached' FROM inquiries i WHERE i.retention_on<=current_date
 UNION ALL SELECT i.id,i.subject,'HANDOFF','Specialist handoff not acknowledged' FROM inquiries i
 WHERE i.kind<>'medical' AND i.state<>'imported' AND NOT EXISTS(SELECT 1 FROM handoffs h WHERE h.inquiry_id=i.id AND h.acknowledged_at IS NOT NULL)
 UNION ALL SELECT i.id,i.subject,'SOURCE','Approved response source is expired or withdrawn' FROM inquiries i
 JOIN reviews r ON r.inquiry_id=i.id JOIN sources s ON s.id=r.source_id
 WHERE r.decision='approved' AND (s.withdrawn OR s.valid_until<current_date)
 UNION ALL SELECT i.id,i.subject,'IMPORT_REVIEW','Imported history requires reconciliation' FROM inquiries i WHERE state='imported';
CREATE VIEW attention AS
 SELECT id,subject,owner,'Overdue reply' AS reason FROM inquiry_desk WHERE state NOT IN ('closed','imported') AND kind='medical' AND due_on<current_date
 UNION ALL SELECT id,subject,owner,'Specialist handoff requires review' FROM inquiry_desk i WHERE kind<>'medical' AND state<>'closed'
 AND NOT EXISTS(SELECT 1 FROM handoffs h WHERE h.inquiry_id=i.id AND h.acknowledged_at IS NOT NULL)
 UNION ALL SELECT id,subject,owner,'Imported history requires reconciliation' FROM inquiry_desk WHERE state='imported'
 UNION ALL SELECT i.id,i.subject,i.owner,c.issue FROM inquiries i JOIN compliance_findings c ON c.id=i.id WHERE c.rule IN ('SOURCE','REQUEST_EVIDENCE','RETENTION');
REVOKE ALL ON inquiry_desk,due_replies,source_review,escalation_desk,compliance_findings,attention FROM PUBLIC;
