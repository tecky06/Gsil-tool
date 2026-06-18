-- GSIL starter signal seed data
-- Run this in Supabase SQL Editor after vendors have been seeded.

with vendor_lookup as (
  select id, external_id from vendors
),
source_seed as (
  insert into sources (name, url, category, confidence, active, trust_score)
  values
    ('Coupa Spend Export', 'https://coupa.example/internal-export', 'Industry Data', 'High', true, 88),
    ('LittleBig Mission Feed', 'https://littlebigconnection.example/internal-feed', 'Industry Data', 'High', true, 84),
    ('Internal SLA Review', 'https://internal.example/sla-review', 'Business News', 'High', true, 90),
    ('Approved Market Intelligence', 'https://market.example/vendor-intelligence', 'Financial News', 'Medium', true, 76)
  on conflict do nothing
  returning id, name
),
sources_all as (
  select id, name from sources
)
insert into signals (
  vendor_id,
  source_id,
  title,
  summary,
  source_name,
  type,
  sentiment,
  dimension,
  impact,
  confidence,
  status,
  ai_explanation,
  evidence
)
values
  (
    (select id from vendor_lookup where external_id = 'vendor-pwc-india'),
    (select id from sources_all where name = 'Internal SLA Review' limit 1),
    'SLA response variance increased for PwC India',
    'FY26 Q1 internal SLA review shows response-time variance moving from 4.2% to 6.9%, increasing delivery governance attention.',
    'Internal SLA Review',
    'Operational',
    'Negative',
    'P',
    6,
    86,
    'pending',
    'Mapped to Performance because the signal references SLA response variance, delivery governance and measurable service movement.',
    '{"metric":"response variance","previous":"4.2%","current":"6.9%","period":"FY26 Q1"}'::jsonb
  ),
  (
    (select id from vendor_lookup where external_id = 'vendor-ey-india'),
    (select id from sources_all where name = 'Approved Market Intelligence' limit 1),
    'EY India attrition pressure visible in delivery teams',
    'Approved market intelligence indicates specialist attrition moved above 14%, creating continuity risk for transformation workstreams.',
    'Approved Market Intelligence',
    'People',
    'Negative',
    'R',
    5,
    79,
    'pending',
    'Mapped to Risk Profile because attrition pressure can affect continuity, staffing quality and delivery resilience.',
    '{"metric":"specialist attrition","current":"14%+","risk":"continuity"}'::jsonb
  ),
  (
    (select id from vendor_lookup where external_id = 'vendor-deloitte-india'),
    (select id from sources_all where name = 'Coupa Spend Export' limit 1),
    'Invoice exception rate increased for Deloitte India',
    'Coupa-style export shows invoice exceptions rising from 3.8% to 7.1% across recent service invoices, requiring commercial validation.',
    'Coupa Spend Export',
    'Financial',
    'Negative',
    'S',
    7,
    91,
    'pending',
    'Mapped to Score & Value because invoice exceptions and commercial validation directly affect spend leakage and value realization.',
    '{"metric":"invoice exception rate","previous":"3.8%","current":"7.1%","source_system":"Coupa"}'::jsonb
  ),
  (
    (select id from vendor_lookup where external_id = 'vendor-kpmg-india'),
    (select id from sources_all where name = 'Approved Market Intelligence' limit 1),
    'Risk advisory demand increasing for KPMG India',
    'Market intelligence shows increased demand for risk advisory capacity, strengthening category relevance for KPMG India.',
    'Approved Market Intelligence',
    'Operational',
    'Positive',
    'M',
    4,
    77,
    'pending',
    'Mapped to Market Fit because the signal references category demand and future relevance.',
    '{"metric":"category demand","trend":"increasing","category":"risk advisory"}'::jsonb
  ),
  (
    (select id from vendor_lookup where external_id = 'vendor-accenture-india'),
    (select id from sources_all where name = 'LittleBig Mission Feed' limit 1),
    'Mission milestone adherence improved for Accenture India',
    'LittleBig-style mission feed shows milestone adherence improving to 94%, supporting integration and delivery confidence.',
    'LittleBig Mission Feed',
    'Operational',
    'Positive',
    'I',
    5,
    89,
    'pending',
    'Mapped to Integration because milestone adherence indicates handoff quality and workflow fit.',
    '{"metric":"milestone adherence","current":"94%","source_system":"LittleBig"}'::jsonb
  ),
  (
    (select id from vendor_lookup where external_id = 'vendor-capgemini-india'),
    (select id from sources_all where name = 'Internal SLA Review' limit 1),
    'Capgemini India support turnaround remains stable',
    'Internal SLA review shows support turnaround stability at 96.2%, supporting Strategic Advantage posture.',
    'Internal SLA Review',
    'Operational',
    'Positive',
    'P',
    4,
    84,
    'pending',
    'Mapped to Performance because turnaround stability directly reflects operational delivery quality.',
    '{"metric":"support turnaround","current":"96.2%","period":"FY26 Q1"}'::jsonb
  ),
  (
    (select id from vendor_lookup where external_id = 'vendor-wipro'),
    (select id from sources_all where name = 'Internal SLA Review' limit 1),
    'Wipro MTTR moved above target threshold',
    'Internal operational review shows mean time to resolution moving from 9.4 hours to 13.8 hours, increasing executive attention need.',
    'Internal SLA Review',
    'Operational',
    'Negative',
    'P',
    8,
    92,
    'pending',
    'Mapped to Performance because MTTR deterioration affects operational reliability and service responsiveness.',
    '{"metric":"MTTR","previous":"9.4h","current":"13.8h","threshold":"12h"}'::jsonb
  ),
  (
    (select id from vendor_lookup where external_id = 'vendor-cognizant-india'),
    (select id from sources_all where name = 'Coupa Spend Export' limit 1),
    'Cognizant India PO cycle delay visible in Coupa extract',
    'Coupa-style extract shows PO cycle time increasing from 5.6 days to 8.2 days, requiring process review.',
    'Coupa Spend Export',
    'Financial',
    'Negative',
    'S',
    5,
    83,
    'pending',
    'Mapped to Score & Value because PO cycle delays can affect procurement efficiency, cost control and value realization.',
    '{"metric":"PO cycle time","previous":"5.6d","current":"8.2d","source_system":"Coupa"}'::jsonb
  )
on conflict do nothing;
