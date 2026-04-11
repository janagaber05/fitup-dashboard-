-- =============================================================================
-- FITUP Dashboard — Supabase schema (PostgreSQL)
-- Paste this entire file into: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================
-- Notes:
-- - Uses UUID primary keys. Map your demo string ids (pg-1, u1) during data import.
-- - Enable Row Level Security (RLS) and add policies before production.
-- - jsonb columns mirror flexible objects from the React app (profile, reply_history, etc.)
-- =============================================================================

-- Optional: ensure UUID generation (Supabase usually has this already)
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Core org / branch
-- -----------------------------------------------------------------------------

create table if not exists public.gyms (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  location text,
  branch_count int default 0,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists public.partner_gyms (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  linked_gym_id uuid references public.gyms (id) on delete set null,
  gym_account_id text,
  source_submission_id text,
  legal_name text,
  brand_name text not null,
  branch_address text,
  branch_members int default 0,
  branch_coaches int default 0,
  website text,
  contact_name text,
  contact_email text,
  contact_phone text,
  company_size text,
  locations_planned int default 1,
  billing_amount numeric(12,2) default 0,
  billing_currency text default 'USD',
  billing_cycle text default 'monthly',
  payment_method text,
  payment_status text,
  has_ems boolean default false,
  contract_signed boolean default false,
  contract_signed_at timestamptz,
  contract_start date,
  contract_end date,
  contract_file_name text,
  contract_file_data_url text,
  contract_draft text,
  onboarding_status text default 'pending',
  manager_name text,
  opening_hours text,
  monthly_revenue numeric(14,2) default 0,
  facilities text,
  branch_equipment text,
  gym_space_sqft int default 0,
  classroom_count int default 0,
  classroom_space_sqft int default 0,
  capacity int default 0,
  year_established int,
  notes text,
  payment_history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_partner_gyms_linked_gym on public.partner_gyms (linked_gym_id);

-- -----------------------------------------------------------------------------
-- Members / CRM users (dashboard "users" — not necessarily auth.users)
-- -----------------------------------------------------------------------------

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  fitup_user_id text unique,
  name text not null,
  email text,
  registered_gym_id uuid references public.gyms (id) on delete set null,
  partner_gym_id uuid references public.partner_gyms (id) on delete set null,
  profile jsonb default '{}'::jsonb,
  status text default 'active',
  signed_in_on_site boolean default false,
  last_site_visit_at timestamptz,
  last_page_viewed text,
  site_page_views_7d int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_app_users_partner_gym on public.app_users (partner_gym_id);
create index if not exists idx_app_users_email on public.app_users (lower(email));

-- -----------------------------------------------------------------------------
-- Equipment (per branch)
-- -----------------------------------------------------------------------------

create table if not exists public.equipment_inventory (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  branch_id uuid not null references public.partner_gyms (id) on delete cascade,
  name text not null,
  quantity int default 1 check (quantity >= 0),
  has_equipment boolean default true,
  under_maintenance boolean default false,
  need_one_more boolean default false,
  need_change boolean default false,
  complaint boolean default false,
  complaint_text text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_equipment_branch on public.equipment_inventory (branch_id);

-- -----------------------------------------------------------------------------
-- Facilities + booking requests
-- -----------------------------------------------------------------------------

create table if not exists public.gym_facilities (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  branch_id uuid not null references public.partner_gyms (id) on delete cascade,
  name text not null,
  schedule text,
  price numeric(12,2) default 0,
  currency text default 'USD',
  status text default 'active',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_gym_facilities_branch on public.gym_facilities (branch_id);

create table if not exists public.facility_booking_requests (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  branch_id uuid not null references public.partner_gyms (id) on delete cascade,
  facility_id uuid not null references public.gym_facilities (id) on delete cascade,
  app_user_id uuid references public.app_users (id) on delete set null,
  member_name text not null,
  member_user_id text,
  requested_slot text not null,
  status text default 'pending',
  payment_method text default 'cash',
  paid_online boolean default false,
  note text,
  source text default 'dashboard',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_facility_bookings_branch on public.facility_booking_requests (branch_id);
create index if not exists idx_facility_bookings_facility on public.facility_booking_requests (facility_id);
create index if not exists idx_facility_bookings_status on public.facility_booking_requests (status);

-- -----------------------------------------------------------------------------
-- Dashboard employees + audit log
-- -----------------------------------------------------------------------------

create table if not exists public.dashboard_employees (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  employee_code text unique,
  name text not null,
  email text not null,
  role text not null default 'user',
  status text default 'active',
  can_manage_dashboard boolean default true,
  created_at timestamptz default now(),
  last_active_at timestamptz
);

create index if not exists idx_dashboard_employees_email on public.dashboard_employees (lower(email));

create table if not exists public.dashboard_employee_activity (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  employee_id uuid references public.dashboard_employees (id) on delete set null,
  employee_name text,
  action text not null,
  detail text,
  at timestamptz default now()
);

create index if not exists idx_employee_activity_at on public.dashboard_employee_activity (at desc);

-- -----------------------------------------------------------------------------
-- Inbox / messages
-- -----------------------------------------------------------------------------

create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  app_user_id uuid references public.app_users (id) on delete set null,
  user_name text,
  user_email text,
  body text not null,
  status text default 'unread',
  reply_status text default 'not_sent',
  reply_history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_inbox_messages_status on public.inbox_messages (status);
create index if not exists idx_inbox_messages_created on public.inbox_messages (created_at desc);

-- -----------------------------------------------------------------------------
-- Optional: single-row or per-gym settings (JSON mirrors React settings object)
-- -----------------------------------------------------------------------------

create table if not exists public.dashboard_settings (
  id uuid primary key default gen_random_uuid(),
  partner_gym_id uuid references public.partner_gyms (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique (partner_gym_id)
);

-- -----------------------------------------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers (idempotent: drop if exists pattern)
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_partner_gyms_updated_at') then
    create trigger set_partner_gyms_updated_at
      before update on public.partner_gyms
      for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_app_users_updated_at') then
    create trigger set_app_users_updated_at
      before update on public.app_users
      for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_equipment_inventory_updated_at') then
    create trigger set_equipment_inventory_updated_at
      before update on public.equipment_inventory
      for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_gym_facilities_updated_at') then
    create trigger set_gym_facilities_updated_at
      before update on public.gym_facilities
      for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_facility_booking_requests_updated_at') then
    create trigger set_facility_booking_requests_updated_at
      before update on public.facility_booking_requests
      for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_inbox_messages_updated_at') then
    create trigger set_inbox_messages_updated_at
      before update on public.inbox_messages
      for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_dashboard_settings_updated_at') then
    create trigger set_dashboard_settings_updated_at
      before update on public.dashboard_settings
      for each row execute procedure public.set_updated_at();
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Row Level Security (enable — add your own policies before going live)
-- -----------------------------------------------------------------------------

alter table public.gyms enable row level security;
alter table public.partner_gyms enable row level security;
alter table public.app_users enable row level security;
alter table public.equipment_inventory enable row level security;
alter table public.gym_facilities enable row level security;
alter table public.facility_booking_requests enable row level security;
alter table public.dashboard_employees enable row level security;
alter table public.dashboard_employee_activity enable row level security;
alter table public.inbox_messages enable row level security;
alter table public.dashboard_settings enable row level security;

-- Example: allow authenticated users full access (REPLACE with real tenant rules)
-- create policy "authenticated_all_gyms" on public.gyms for all to authenticated using (true) with check (true);
-- ...repeat per table or scope by partner_gym_id = jwt claim...

comment on table public.partner_gyms is 'Branches / partner gym locations';
comment on table public.app_users is 'Members and CRM users shown in dashboard';
comment on table public.equipment_inventory is 'Per-branch equipment checklist';
comment on table public.gym_facilities is 'Juice bar, sauna, jacuzzi, etc.';
comment on table public.facility_booking_requests is 'Facility booking requests (app or dashboard)';
comment on table public.dashboard_employees is 'Staff who manage the dashboard';
comment on table public.inbox_messages is 'Dashboard inbox messages + reply_history jsonb';
