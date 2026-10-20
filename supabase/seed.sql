INSERT INTO products(id,name) VALUES
 ('10000000-0000-4000-8000-000000000001','Demo Product Alpha'),
 ('10000000-0000-4000-8000-000000000002','Demo Product Beta') ON CONFLICT DO NOTHING;
INSERT INTO sources(id,product_id,title,version,reference,approver,approval_evidence,valid_until) VALUES
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Approved information index','v3','controlled://alpha/index-v3','Medical reviewer','evidence://demo/source-1',current_date+90),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Archived information index','v1','controlled://alpha/index-v1','Medical reviewer','evidence://demo/source-2',current_date-10),
 ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','Beta information index','v1','controlled://beta/index','Medical reviewer','evidence://demo/source-3',current_date+15) ON CONFLICT DO NOTHING;
INSERT INTO inquiries(id,product_id,subject,requester_ref,request_evidence,owner,kind,state,received_on,due_on,retention_on) VALUES
 ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Approved document request','hcp-demo-001','evidence://demo/request-1','Mira','medical','open',current_date-12,current_date-5,current_date+180),
 ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Safety team callback request','hcp-demo-002','evidence://demo/request-2','Mira','safety','open',current_date-1,current_date,current_date+180),
 ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','Product quality follow-up','hcp-demo-003','evidence://demo/request-3','Noah','quality','open',current_date-3,current_date-1,current_date+180),
 ('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002','Reference version request','hcp-demo-004','','Noah','medical','open',current_date-4,current_date+2,current_date+180),
 ('30000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000001','Old response file review','hcp-demo-005','evidence://demo/request-5','Mira','medical','closed',current_date-210,current_date-200,current_date-1),
 ('30000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000001','Source renewal follow-up','hcp-demo-006','evidence://demo/request-6','Noah','medical','ready',current_date-20,current_date-3,current_date+160) ON CONFLICT DO NOTHING;
INSERT INTO reviews(id,inquiry_id,source_id,preparer,response_ref,reviewer,decision,evidence) VALUES
 ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000002','Noah','controlled://demo/response-6','Mira','approved','evidence://demo/review-6') ON CONFLICT DO NOTHING;
INSERT INTO handoffs(id,inquiry_id,team,reference,actor) VALUES
 ('50000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000003','Quality','quality://demo/3','Noah') ON CONFLICT DO NOTHING;
INSERT INTO events(id,inquiry_id,action,actor,reference) VALUES
 ('60000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','created','Demo seed','evidence://demo/request-1') ON CONFLICT DO NOTHING;
