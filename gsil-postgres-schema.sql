-- GSIL PostgreSQL starter schema
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  role_key text not null references roles(key),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  category text not null,
  tier text not null default 'Core',
  status text not null default 'amber',
  schedule text not null default 'Daily',
  specialist boolean not null default false,
  prism_score numeric(4,2) not null default 7.00,
  dimensions jsonb not null default '{"P":7,"R":7,"I":7,"S":7,"M":7}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  category text not null default 'Business News',
  confidence text not null default 'Medium',
  active boolean not null default true,
  trust_score integer not null default 70,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists signals (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  source_id uuid references sources(id),
  title text not null,
  summary text not null,
  source_name text,
  type text not null default 'Operational',
  sentiment text not null default 'Negative',
  dimension text not null check (dimension in ('P','R','I','S','M')),
  impact integer not null default 5 check (impact between 1 and 10),
  confidence integer not null default 75 check (confidence between 0 and 100),
  status text not null default 'pending',
  ai_explanation text,
  evidence jsonb not null default '{}'::jsonb,
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create table if not exists internal_inputs (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  dimension text not null check (dimension in ('P','R','I','S','M')),
  period text not null,
  evidence text not null,
  weight integer not null default 30 check (weight between 0 and 100),
  feed_type text not null default 'Manual Upload',
  status text not null default 'approved',
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  actor_name text,
  event_type text not null,
  message text not null,
  vendor_id uuid references vendors(id) on delete set null,
  signal_id uuid references signals(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists connectors (
  id text primary key,
  name text not null,
  connector_type text not null,
  category text not null,
  status text not null default 'paused',
  owner text,
  trust_score integer not null default 70,
  last_sync timestamptz,
  next_sync timestamptz,
  last_error text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists connector_runs (
  id uuid primary key default gen_random_uuid(),
  connector_id text not null references connectors(id),
  status text not null,
  records_seen integer not null default 0,
  signals_created integer not null default 0,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists qbr_snapshots (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  score numeric(4,2) not null,
  status text not null,
  dimensions jsonb not null,
  recent_audit jsonb not null default '[]'::jsonb,
  generated_by uuid references users(id),
  generated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) on delete set null,
  signal_id uuid references signals(id) on delete set null,
  title text not null,
  vendor_name text,
  stage text not null default 'To Review',
  owner text not null default 'Procurement Owner',
  due text not null default 'This week',
  action text,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) on delete set null,
  action text not null,
  owner text not null default 'Procurement Owner',
  context text,
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references users(id),
  updated_at timestamptz not null default now()
);

insert into roles (key, label, permissions) values
  ('admin', 'Admin', '["view","vendor:write","source:write","signal:pull","signal:approve","signal:reject","signal:bulk","internal:write","connector:sync","qbr:write","report:export","settings:write"]'::jsonb),
  ('procurement_head', 'Procurement Head', '["view","vendor:write","signal:pull","signal:approve","signal:reject","signal:bulk","connector:sync","qbr:write","report:export"]'::jsonb),
  ('analyst', 'Analyst', '["view","signal:pull","signal:reject","internal:write","source:write","report:export"]'::jsonb),
  ('finance_controller', 'Finance Controller', '["view","internal:write","qbr:write","report:export"]'::jsonb),
  ('viewer', 'Viewer', '["view","report:export"]'::jsonb)
on conflict (key) do update
set label = excluded.label,
    permissions = excluded.permissions;

insert into connectors (id, name, connector_type, category, status, owner, trust_score) values
  ('coupa', 'Coupa', 'Procurement API', 'Spend and invoice intelligence', 'paused', 'Procurement Ops', 84),
  ('littlebig', 'LittleBig Connection', 'Services API', 'Mission and services performance', 'paused', 'Services Procurement', 81),
  ('vendor-master', 'Vendor Master', 'Master Data', 'Vendor identity and ownership', 'paused', 'Data Governance', 88)
on conflict (id) do update
set name = excluded.name,
    connector_type = excluded.connector_type,
    category = excluded.category,
    owner = excluded.owner,
    trust_score = excluded.trust_score;

create index if not exists idx_vendors_status on vendors(status);
create index if not exists idx_signals_vendor_status on signals(vendor_id, status);
create index if not exists idx_audit_vendor_created on audit_events(vendor_id, created_at desc);
create index if not exists idx_internal_inputs_vendor on internal_inputs(vendor_id, created_at desc);
create index if not exists idx_tasks_vendor_stage on tasks(vendor_id, stage);
create index if not exists idx_decisions_vendor_created on decisions(vendor_id, created_at desc);
