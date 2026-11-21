-- Complete Supabase setup. Safe to rerun; existing invitation data is retained.
-- Run the entire file in SQL Editor after creating the administrator Auth user.
begin;
create extension if not exists unaccent with schema extensions;
create table if not exists public.admin_users(user_id uuid primary key references auth.users(id),role text not null check(role in ('owner','admin')));
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from admin_users where user_id=auth.uid()) $$;
create table if not exists public.content_versions(id uuid primary key default gen_random_uuid(),config jsonb not null,state text not null check(state in ('draft','published','archived')),created_at timestamptz default now());
create unique index if not exists one_published_version on public.content_versions(state) where state='published';
create unique index if not exists one_draft_version on public.content_versions(state) where state='draft';
create table if not exists public.invitation_groups(id uuid primary key default gen_random_uuid(),name text not null);
create table if not exists public.guests(id uuid primary key default gen_random_uuid(),group_id uuid not null references public.invitation_groups(id) on delete cascade,name text not null,status text not null default 'pending' check(status in ('pending','attending','declined')),updated_at timestamptz default now());
create index if not exists guests_group on public.guests(group_id);
create table if not exists public.rsvp_history(id uuid primary key default gen_random_uuid(),guest_id uuid not null references public.guests(id) on delete cascade,previous_status text,next_status text,changed_at timestamptz default now(),source text);
create table if not exists public.request_limits(key text primary key,hits int not null default 1,window_start timestamptz not null default now());
create table if not exists public.selection_refs(token uuid primary key default gen_random_uuid(),group_id uuid references public.invitation_groups(id) on delete cascade,expires_at timestamptz default now()+interval '20 minutes');
alter table public.admin_users enable row level security;
alter table public.content_versions enable row level security;
alter table public.invitation_groups enable row level security;
alter table public.guests enable row level security;
alter table public.rsvp_history enable row level security;
alter table public.request_limits enable row level security;
alter table public.selection_refs enable row level security;
drop policy if exists admin_self on public.admin_users;
create policy admin_self on public.admin_users for select to authenticated using(user_id=auth.uid());
drop policy if exists content_admin on public.content_versions;
create policy content_admin on public.content_versions for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists groups_admin on public.invitation_groups;
create policy groups_admin on public.invitation_groups for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists guests_admin on public.guests;
create policy guests_admin on public.guests for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists history_admin on public.rsvp_history;
create policy history_admin on public.rsvp_history for select to authenticated using(public.is_admin());
create or replace function public.audit_guest_response() returns trigger language plpgsql security definer set search_path=public as $$ begin if old.status is distinct from new.status then insert into rsvp_history(guest_id,previous_status,next_status,source) values(new.id,old.status,new.status,case when auth.uid() is null then 'guest' else 'admin' end);end if;new.updated_at=now();return new;end $$;
drop trigger if exists guest_response_audit on public.guests;
create trigger guest_response_audit before update on public.guests for each row execute function public.audit_guest_response();
create or replace function public.add_invitation_group(p_id uuid,p_name text,p_members jsonb) returns void language plpgsql security definer set search_path=public as $$ declare m jsonb;begin
if not public.is_admin() then raise exception 'Unauthorized';end if;
if jsonb_array_length(p_members)<1 then raise exception 'Members required';end if;
insert into invitation_groups(id,name) values(p_id,p_name);for m in select * from jsonb_array_elements(p_members) loop insert into guests(id,group_id,name) values((m->>'id')::uuid,p_id,m->>'name');end loop;end $$;
create or replace function public.check_request_limit(p_key text) returns boolean language plpgsql security definer set search_path=public as $$ declare n int;begin
insert into request_limits(key) values(p_key) on conflict(key) do update set hits=case when request_limits.window_start<now()-interval '1 minute' then 1 else request_limits.hits+1 end,window_start=case when request_limits.window_start<now()-interval '1 minute' then now() else request_limits.window_start end returning hits into n;return n<=20;end $$;
create or replace function public.submit_invitation_rsvp(p_token uuid,p_members jsonb) returns void language plpgsql security definer set search_path=public as $$ declare gid uuid;m jsonb;deadline text;begin
select group_id into gid from selection_refs where token=p_token and expires_at>now();if gid is null then raise exception 'Invitation expired. Please search again.';end if;
select config->>'deadline' into deadline from content_versions where state='published';if coalesce(deadline,'')<>'' and deadline::timestamptz<now() then raise exception 'RSVP has closed';end if;
if jsonb_array_length(p_members)>30 then raise exception 'Too many members';end if;
for m in select * from jsonb_array_elements(p_members) loop
if not exists(select 1 from guests where id=(m->>'id')::uuid and group_id=gid) then raise exception 'Invalid group membership';end if;
if m->>'status' not in ('pending','attending','declined') then raise exception 'Invalid response';end if;
if m->>'status'<>'pending' then update guests set status=m->>'status' where id=(m->>'id')::uuid and group_id=gid;end if;end loop;end $$;
revoke all on function public.check_request_limit(text) from public,anon,authenticated;
revoke all on function public.submit_invitation_rsvp(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.check_request_limit(text) to service_role;
grant execute on function public.submit_invitation_rsvp(uuid,jsonb) to service_role;

revoke all on function public.add_invitation_group(uuid,text,jsonb) from public,anon;
grant execute on function public.add_invitation_group(uuid,text,jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('invitation-media','invitation-media',false,15728640,array['image/jpeg','image/png','image/webp','audio/mpeg','audio/ogg','audio/mp4']) on conflict do nothing;
drop policy if exists media_admin on storage.objects;
create policy media_admin on storage.objects for all to authenticated using(bucket_id='invitation-media' and public.is_admin()) with check(bucket_id='invitation-media' and public.is_admin());

-- Atomic CSV import; all rows are validated before the transaction commits.
create or replace function public.import_invitation_groups(p_groups jsonb) returns void
language plpgsql security definer set search_path=public as $$
declare g jsonb;m jsonb;total_people integer:=0;
begin
 if not public.is_admin() then raise exception 'Unauthorized';end if;
 if jsonb_typeof(p_groups) is distinct from 'array' or jsonb_array_length(p_groups)<1 or jsonb_array_length(p_groups)>1000 then raise exception 'Import between 1 and 1000 invitations';end if;
 for g in select * from jsonb_array_elements(p_groups) loop
  if length(trim(coalesce(g->>'name','')))=0 or length(g->>'name')>120 then raise exception 'Invalid invitation name';end if;
  if jsonb_typeof(g->'members') is distinct from 'array' or jsonb_array_length(g->'members')<1 or jsonb_array_length(g->'members')>30 then raise exception 'Invalid invitation members';end if;
  total_people:=total_people+jsonb_array_length(g->'members');
  if total_people>5000 then raise exception 'Import at most 5000 people';end if;
  insert into invitation_groups(id,name) values((g->>'id')::uuid,trim(g->>'name'));
  for m in select * from jsonb_array_elements(g->'members') loop
   if length(trim(coalesce(m->>'name','')))=0 or length(m->>'name')>120 or coalesce(m->>'status','') not in ('pending','attending','declined') then raise exception 'Invalid guest';end if;
   insert into guests(id,group_id,name,status) values((m->>'id')::uuid,(g->>'id')::uuid,trim(m->>'name'),m->>'status');
  end loop;
 end loop;
end $$;
revoke all on function public.import_invitation_groups(jsonb) from public,anon;
grant execute on function public.import_invitation_groups(jsonb) to authenticated;

-- Keep draft and live snapshots consistent and validate again on the server.
create or replace function public.save_invitation_content(p_config jsonb,p_publish boolean) returns void
language plpgsql security definer set search_path=public as $$
declare gift jsonb;item text;event_at timestamptz;deadline_at timestamptz;zone text;
begin
 if not public.is_admin() then raise exception 'Unauthorized';end if;
 if jsonb_typeof(p_config) is distinct from 'object' or octet_length(p_config::text)>2000000 then raise exception 'Invalid invitation configuration';end if;
 if length(trim(coalesce(p_config->>'name','')))=0 then raise exception 'Add the child''s name';end if;
 zone:=coalesce(p_config->>'timezone','Asia/Manila');
 if not exists(select 1 from pg_timezone_names where name=zone) then raise exception 'Choose a valid timezone';end if;
 if coalesce(p_config->>'date','')<>'' then event_at:=(p_config->>'date')::timestamptz;end if;
 if coalesce(p_config->>'deadline','')<>'' then deadline_at:=(p_config->>'deadline')::timestamptz;end if;
 if event_at is not null and deadline_at is not null and deadline_at>event_at then raise exception 'The RSVP deadline must be before the event';end if;
 if p_publish and (not(p_config ? 'sections') or (p_config->'sections') @> '["details"]'::jsonb) and length(trim(coalesce(p_config->>'church','')))=0 then raise exception 'Add the ceremony venue before publishing';end if;
 if p_publish and (event_at is null or length(trim(coalesce(p_config->>'hero','')))=0) then raise exception 'Add an event date and main photo before publishing';end if;
 if p_config ? 'sections' then
  if jsonb_typeof(p_config->'sections') is distinct from 'array' then raise exception 'Invalid section settings';end if;
  for item in select jsonb_array_elements_text(p_config->'sections') loop
   if item not in ('welcome','details','gallery','gifts','message','rsvp') then raise exception 'Invalid section';end if;
  end loop;
 end if;
 if jsonb_typeof(p_config->'gallery') is distinct from 'array' then raise exception 'Invalid gallery';end if;
 if jsonb_array_length(p_config->'gallery')>50 then raise exception 'Use at most 50 gallery photos';end if;
 if p_publish and exists(select 1 from jsonb_array_elements_text(p_config->'gallery') as photo(value) where length(trim(value))=0) then raise exception 'Replace or remove empty gallery photos';end if;
 for item in select jsonb_array_elements_text(p_config->'gallery') union all select p_config->>'hero' union all select p_config->>'music' loop
  if coalesce(item,'')<>'' and not (item like 'https://%' or item like 'storage:%' or (left(item,1)='/' and left(item,2)<>'//')) then raise exception 'Use HTTPS URLs or uploaded media';end if;
 end loop;
 if coalesce(p_config->>'mapUrl','')<>'' and (p_config->>'mapUrl') not like 'https://%' then raise exception 'Use an HTTPS directions link';end if;
 if p_config ? 'giftIdeas' then
  if jsonb_typeof(p_config->'giftIdeas') is distinct from 'array' then raise exception 'Invalid gift wish list';end if;
  if jsonb_array_length(p_config->'giftIdeas')>20 then raise exception 'Use at most 20 gift ideas';end if;
  for gift in select * from jsonb_array_elements(p_config->'giftIdeas') loop
   if jsonb_typeof(gift) is distinct from 'object' or length(trim(coalesce(gift->>'name','')))=0 or length(gift->>'name')>160 or length(coalesce(gift->>'notes',''))>1000 then raise exception 'Add a valid gift name and notes';end if;
   if coalesce(gift->>'url','')<>'' and (gift->>'url') !~ '^https://[^/@[:space:]]+([/:?\#]|$)' then raise exception 'Use HTTPS store links';end if;
  end loop;
 end if;
 perform pg_advisory_xact_lock(hashtext('christening-content-publication'));
 if p_publish then update content_versions set state='archived' where state='published';insert into content_versions(config,state) values(p_config,'published');end if;
 delete from content_versions where state='draft';
 insert into content_versions(config,state) values(p_config,'draft');
end $$;
revoke all on function public.save_invitation_content(jsonb,boolean) from public,anon;
grant execute on function public.save_invitation_content(jsonb,boolean) to authenticated;

-- Explicit grants make setup independent of the project's default privileges.
-- RLS remains the authorization boundary for authenticated administrators.
grant usage on schema public to anon,authenticated,service_role;
revoke all on public.admin_users,public.content_versions,public.invitation_groups,public.guests,public.rsvp_history,public.request_limits,public.selection_refs from anon,authenticated;
grant select on public.admin_users to authenticated;
grant select,insert,update,delete on public.content_versions,public.invitation_groups,public.guests to authenticated;
grant select on public.rsvp_history to authenticated;
grant all on public.admin_users,public.content_versions,public.invitation_groups,public.guests,public.rsvp_history,public.request_limits,public.selection_refs to service_role;

-- Create this user in Authentication > Users first. No password is stored here.
do $$ declare owner_id uuid; begin
 select id into owner_id from auth.users where lower(email)=lower('juanenriquesantiago830@gmail.com');
 if owner_id is null then raise notice 'Create the administrator in Authentication > Users, then rerun this script to grant access.';
 else insert into public.admin_users(user_id,role) values(owner_id,'owner') on conflict(user_id) do update set role='owner';end if;
end $$;

commit;
