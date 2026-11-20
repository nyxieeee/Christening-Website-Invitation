create extension if not exists unaccent with schema extensions;
create table public.admin_users(user_id uuid primary key references auth.users(id),role text not null check(role in ('owner','admin')));
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from admin_users where user_id=auth.uid()) $$;
create table public.content_versions(id uuid primary key default gen_random_uuid(),config jsonb not null,state text not null check(state in ('draft','published','archived')),created_at timestamptz default now());
create unique index one_published_version on public.content_versions(state) where state='published';
create unique index one_draft_version on public.content_versions(state) where state='draft';
create table public.invitation_groups(id uuid primary key default gen_random_uuid(),name text not null);
create table public.guests(id uuid primary key default gen_random_uuid(),group_id uuid not null references public.invitation_groups(id) on delete cascade,name text not null,status text not null default 'pending' check(status in ('pending','attending','declined')),updated_at timestamptz default now());
create index guests_group on public.guests(group_id);
create table public.rsvp_history(id uuid primary key default gen_random_uuid(),guest_id uuid not null references public.guests(id) on delete cascade,previous_status text,next_status text,changed_at timestamptz default now(),source text);
create table public.request_limits(key text primary key,hits int not null default 1,window_start timestamptz not null default now());
create table public.selection_refs(token uuid primary key default gen_random_uuid(),group_id uuid references public.invitation_groups(id) on delete cascade,expires_at timestamptz default now()+interval '20 minutes');
alter table public.admin_users enable row level security;
alter table public.content_versions enable row level security;
alter table public.invitation_groups enable row level security;
alter table public.guests enable row level security;
alter table public.rsvp_history enable row level security;
alter table public.request_limits enable row level security;
alter table public.selection_refs enable row level security;
create policy admin_self on public.admin_users for select to authenticated using(user_id=auth.uid());
create policy content_admin on public.content_versions for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy groups_admin on public.invitation_groups for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy guests_admin on public.guests for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy history_admin on public.rsvp_history for select to authenticated using(public.is_admin());
create function public.audit_guest_response() returns trigger language plpgsql security definer set search_path=public as $$ begin if old.status is distinct from new.status then insert into rsvp_history(guest_id,previous_status,next_status,source) values(new.id,old.status,new.status,case when auth.uid() is null then 'guest' else 'admin' end);end if;new.updated_at=now();return new;end $$;
create trigger guest_response_audit before update on public.guests for each row execute function public.audit_guest_response();
create function public.save_invitation_content(p_config jsonb,p_publish boolean) returns void language plpgsql security definer set search_path=public as $$ begin
if not public.is_admin() then raise exception 'Unauthorized';end if;
if coalesce(trim(p_config->>'name'),'')='' then raise exception 'Name required';end if;
if p_publish then update content_versions set state='archived' where state='published';insert into content_versions(config,state) values(p_config,'published');else delete from content_versions where state='draft';insert into content_versions(config,state) values(p_config,'draft');end if;end $$;
create function public.add_invitation_group(p_id uuid,p_name text,p_members jsonb) returns void language plpgsql security definer set search_path=public as $$ declare m jsonb;begin
if not public.is_admin() then raise exception 'Unauthorized';end if;
if jsonb_array_length(p_members)<1 then raise exception 'Members required';end if;
insert into invitation_groups(id,name) values(p_id,p_name);for m in select * from jsonb_array_elements(p_members) loop insert into guests(id,group_id,name) values((m->>'id')::uuid,p_id,m->>'name');end loop;end $$;
create function public.check_request_limit(p_key text) returns boolean language plpgsql security definer set search_path=public as $$ declare n int;begin
insert into request_limits(key) values(p_key) on conflict(key) do update set hits=case when request_limits.window_start<now()-interval '1 minute' then 1 else request_limits.hits+1 end,window_start=case when request_limits.window_start<now()-interval '1 minute' then now() else request_limits.window_start end returning hits into n;return n<=20;end $$;
create function public.submit_invitation_rsvp(p_token uuid,p_members jsonb) returns void language plpgsql security definer set search_path=public as $$ declare gid uuid;m jsonb;deadline text;begin
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
revoke all on function public.save_invitation_content(jsonb,boolean) from public,anon;
revoke all on function public.add_invitation_group(uuid,text,jsonb) from public,anon;
grant execute on function public.save_invitation_content(jsonb,boolean),public.add_invitation_group(uuid,text,jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('invitation-media','invitation-media',false,15728640,array['image/jpeg','image/png','image/webp','audio/mpeg','audio/ogg','audio/mp4']) on conflict do nothing;
create policy media_admin on storage.objects for all to authenticated using(bucket_id='invitation-media' and public.is_admin()) with check(bucket_id='invitation-media' and public.is_admin());
