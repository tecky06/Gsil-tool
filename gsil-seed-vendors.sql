-- GSIL starter vendor seed data
-- Run this in Supabase SQL Editor after the schema has been created.

insert into vendors (
  external_id,
  name,
  category,
  tier,
  status,
  schedule,
  specialist,
  prism_score,
  dimensions,
  metadata
) values
  (
    'vendor-pwc-india',
    'PwC India',
    'Consulting and advisory services',
    'Strategic',
    'amber',
    'Daily',
    false,
    7.35,
    '{"P":7.4,"R":7.0,"I":7.6,"S":7.2,"M":7.5}'::jsonb,
    '{"owner":"Procurement Head","country":"India","notes":"Strategic advisory and transformation services"}'::jsonb
  ),
  (
    'vendor-ey-india',
    'EY India',
    'Consulting and professional services',
    'Strategic',
    'amber',
    'Daily',
    false,
    7.20,
    '{"P":7.1,"R":6.9,"I":7.4,"S":7.0,"M":7.6}'::jsonb,
    '{"owner":"Category Manager","country":"India","notes":"Tax, assurance, consulting and transformation services"}'::jsonb
  ),
  (
    'vendor-deloitte-india',
    'Deloitte India',
    'Consulting and technology advisory',
    'Strategic',
    'green',
    'Daily',
    false,
    7.85,
    '{"P":8.0,"R":7.4,"I":7.9,"S":7.8,"M":8.1}'::jsonb,
    '{"owner":"Procurement Head","country":"India","notes":"Technology consulting and enterprise transformation"}'::jsonb
  ),
  (
    'vendor-kpmg-india',
    'KPMG India',
    'Risk, audit and consulting services',
    'Core',
    'amber',
    'Weekly',
    false,
    7.05,
    '{"P":7.0,"R":7.2,"I":6.8,"S":7.0,"M":7.3}'::jsonb,
    '{"owner":"Risk Procurement","country":"India","notes":"Risk, audit, tax and consulting support"}'::jsonb
  ),
  (
    'vendor-accenture-india',
    'Accenture India',
    'Technology and managed services',
    'Strategic',
    'green',
    'Daily',
    false,
    8.10,
    '{"P":8.2,"R":7.6,"I":8.3,"S":8.0,"M":8.4}'::jsonb,
    '{"owner":"IT Procurement","country":"India","notes":"Technology delivery, managed services and transformation"}'::jsonb
  ),
  (
    'vendor-capgemini-india',
    'Capgemini India',
    'Technology services',
    'Core',
    'green',
    'Daily',
    false,
    7.75,
    '{"P":7.8,"R":7.4,"I":7.9,"S":7.6,"M":8.0}'::jsonb,
    '{"owner":"IT Procurement","country":"India","notes":"Digital, cloud and engineering services"}'::jsonb
  ),
  (
    'vendor-wipro',
    'Wipro',
    'IT services and operations',
    'Core',
    'red',
    'Daily',
    false,
    6.45,
    '{"P":6.2,"R":6.5,"I":6.8,"S":6.4,"M":6.7}'::jsonb,
    '{"owner":"Operations Procurement","country":"India","notes":"IT services and operational delivery support"}'::jsonb
  ),
  (
    'vendor-cognizant-india',
    'Cognizant India',
    'IT and business process services',
    'Core',
    'amber',
    'Weekly',
    false,
    7.10,
    '{"P":7.2,"R":6.8,"I":7.3,"S":7.0,"M":7.2}'::jsonb,
    '{"owner":"IT Procurement","country":"India","notes":"Application, digital and business process services"}'::jsonb
  )
on conflict (external_id) do update
set name = excluded.name,
    category = excluded.category,
    tier = excluded.tier,
    status = excluded.status,
    schedule = excluded.schedule,
    specialist = excluded.specialist,
    prism_score = excluded.prism_score,
    dimensions = excluded.dimensions,
    metadata = excluded.metadata,
    updated_at = now();
