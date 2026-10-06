-- The one-time code every management account needs, kept server-side only.
--
-- The code is generated when a management sign-in passes its password step, expires after ten
-- minutes, and is marked used the moment it is verified. No client ever reads this table: it is
-- written and read by route handlers with the service-role key.
create table if not exists management_codes (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff_members (id) on delete cascade,
  code text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists management_codes_staff_idx on management_codes (staff_id, created_at desc);

alter table management_codes enable row level security;
-- no policy at all: only the service-role key (server code) may touch it.
