create extension if not exists pgcrypto;

create table if not exists public.workshop_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  annualRevenue text not null,
  experience text not null,
  amount integer not null default 19900,
  currency text not null default 'INR',
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed')),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workshop_registrations_email_idx
  on public.workshop_registrations (lower(email));
create index if not exists workshop_registrations_created_at_idx
  on public.workshop_registrations (created_at desc);

-- Browser clients must not read or write registrations directly.
alter table public.workshop_registrations enable row level security;

revoke all on public.workshop_registrations from anon, authenticated;
-- The backend uses the Supabase service_role key, which bypasses RLS.
