begin;
-- These checks run in a transaction and leave no test records behind.
do $$
declare t text; role_name text; enabled boolean;
begin
 foreach t in array array['inquiries','bookings','communications','google_oauth_tokens','archive_oauth_states','archive_rate_limits','archive_backend_locks'] loop
  select relrowsecurity into enabled from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=t;
  if enabled is distinct from true then raise exception 'RLS missing on %',t; end if;
  foreach role_name in array array['anon','authenticated'] loop
   if has_table_privilege(role_name,'public.'||t,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Unexpected public privileges on %',t;end if;
  end loop;
 end loop;
 if has_function_privilege('anon','public.archive_claim_lock(text,uuid)','EXECUTE') then raise exception 'Public lock RPC';end if;
 if has_function_privilege('authenticated','public.archive_take_rate_limit(text,integer,integer)','EXECUTE') then raise exception 'Public rate RPC';end if;
end $$;
set local role anon;
do $$ begin
 begin perform id from public.inquiries limit 1; raise exception 'Anonymous SELECT unexpectedly succeeded';exception when insufficient_privilege then null;end;
 begin insert into public.inquiries(name,email,inquiry_type,message,idempotency_key,payload_hash) values('Denied','denied@example.com','General inquiry','Denied',gen_random_uuid(),'denied');raise exception 'Anonymous INSERT unexpectedly succeeded';exception when insufficient_privilege then null;end;
 begin perform id from public.bookings limit 1; raise exception 'Anonymous bookings SELECT succeeded';exception when insufficient_privilege then null;end;
 begin perform refresh_token from public.google_oauth_tokens limit 1; raise exception 'Anonymous token SELECT succeeded';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role authenticated;
do $$ begin
 begin perform id from public.communications limit 1;raise exception 'Authenticated communications SELECT succeeded';exception when insufficient_privilege then null;end;
 begin update public.bookings set status='approved';raise exception 'Authenticated booking UPDATE succeeded';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'RLS, grants and unauthorized SQL access tests passed' as result;
rollback;
