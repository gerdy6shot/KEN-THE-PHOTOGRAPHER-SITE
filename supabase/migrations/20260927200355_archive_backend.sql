begin;
create table public.inquiries (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 name text not null, email text not null, phone text, organization text, inquiry_type text not null,
 photograph_id text, photograph_title text, message text not null,
 status text not null default 'new' check (status in ('new','reviewing','replied','follow_up','closed')),
 source text not null default 'website', assigned_to text,
 gemini_category text, gemini_summary text, gemini_priority text, gemini_draft_reply text,
 google_message_id text, google_thread_id text,
 idempotency_key uuid not null unique, payload_hash text not null,
 processing_status text not null default 'pending', processing_error text
);
create table public.bookings (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 name text not null, email text not null, phone text, organization text, booking_type text not null,
 requested_start timestamptz not null, requested_end timestamptz not null, timezone text not null, notes text,
 status text not null default 'requested' check (status in ('requested','pending','approved','declined','cancelled','completed')),
 google_event_id text unique, google_calendar_id text, google_html_link text, gemini_summary text, gemini_draft_reply text,
 idempotency_key uuid not null unique, payload_hash text not null, sync_error text,
 check(requested_end > requested_start)
);
create table public.communications (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 inquiry_id uuid references public.inquiries(id) on delete cascade, booking_id uuid references public.bookings(id) on delete cascade,
 direction text not null check(direction in ('inbound','outbound')), channel text not null default 'email',
 from_email text, to_email text, subject text, body text, google_message_id text, google_thread_id text, sent_at timestamptz,
 dedupe_key text not null unique, delivery_status text not null default 'pending' check(delivery_status in ('pending','sending','sent','failed','uncertain')),
 error_code text, check(num_nonnulls(inquiry_id,booking_id)=1)
);
-- Credential columns contain AES-GCM ciphertext, never plaintext. The key lives only in Edge secrets.
create table public.google_oauth_tokens (
 id uuid primary key default gen_random_uuid(), account_email text unique not null,
 refresh_token text, access_token text, expires_at timestamptz, scope text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.archive_oauth_states (state_hash text primary key, verifier text not null, expires_at timestamptz not null);
create table public.archive_rate_limits (bucket text primary key, window_start timestamptz not null, hits integer not null);
create table public.archive_backend_locks (lock_key text primary key, owner uuid not null, expires_at timestamptz not null);

create index inquiries_created_at_idx on public.inquiries(created_at desc);
create index inquiries_status_idx on public.inquiries(status,created_at desc);
create index bookings_start_idx on public.bookings(requested_start);
create index communications_inquiry_idx on public.communications(inquiry_id);
create index communications_booking_idx on public.communications(booking_id);
create index communications_delivery_idx on public.communications(delivery_status,created_at);

create function public.archive_touch_updated_at() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
create trigger inquiries_updated before update on public.inquiries for each row execute function public.archive_touch_updated_at();
create trigger bookings_updated before update on public.bookings for each row execute function public.archive_touch_updated_at();
create trigger google_tokens_updated before update on public.google_oauth_tokens for each row execute function public.archive_touch_updated_at();

-- Atomic distributed rate limits, available only to trusted service-role calls.
create function public.archive_take_rate_limit(p_bucket text,p_limit integer,p_seconds integer) returns boolean
language plpgsql security invoker set search_path='' as $$
declare used integer;
begin
 if p_limit<1 or p_seconds<1 then return false; end if;
 insert into public.archive_rate_limits(bucket,window_start,hits) values(p_bucket,now(),1)
 on conflict(bucket) do update set
 hits=case when archive_rate_limits.window_start < now()-make_interval(secs=>p_seconds) then 1 else archive_rate_limits.hits+1 end,
 window_start=case when archive_rate_limits.window_start < now()-make_interval(secs=>p_seconds) then now() else archive_rate_limits.window_start end
 returning hits into used;
 delete from public.archive_rate_limits where window_start<now()-interval '2 days';
 return used<=p_limit;
end $$;
create function public.archive_claim_lock(p_key text,p_owner uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare claimed uuid;
begin
 insert into public.archive_backend_locks(lock_key,owner,expires_at) values(p_key,p_owner,now()+interval '5 minutes')
 on conflict(lock_key) do update set owner=excluded.owner,expires_at=excluded.expires_at
 where archive_backend_locks.expires_at<now() returning owner into claimed;
 return claimed=p_owner;
end $$;

-- No public or authenticated policies: even signed-in visitors cannot access records.
do $$ declare t text; begin
 foreach t in array array['inquiries','bookings','communications','google_oauth_tokens','archive_oauth_states','archive_rate_limits','archive_backend_locks'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on table public.%I from public, anon, authenticated',t);
 execute format('grant all on table public.%I to service_role',t);
 end loop;
end $$;
revoke all on function public.archive_touch_updated_at() from public,anon,authenticated;
revoke all on function public.archive_take_rate_limit(text,integer,integer) from public,anon,authenticated;
revoke all on function public.archive_claim_lock(text,uuid) from public,anon,authenticated;
grant execute on function public.archive_take_rate_limit(text,integer,integer),public.archive_claim_lock(text,uuid) to service_role;
commit;
