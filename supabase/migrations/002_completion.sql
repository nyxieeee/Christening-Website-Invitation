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
declare item text;event_at timestamptz;deadline_at timestamptz;zone text;
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
   if item not in ('welcome','details','gallery','message','rsvp') then raise exception 'Invalid section';end if;
  end loop;
 end if;
 if jsonb_typeof(p_config->'gallery') is distinct from 'array' then raise exception 'Invalid gallery';end if;
 if jsonb_array_length(p_config->'gallery')>50 then raise exception 'Use at most 50 gallery photos';end if;
 if p_publish and exists(select 1 from jsonb_array_elements_text(p_config->'gallery') as photo(value) where length(trim(value))=0) then raise exception 'Replace or remove empty gallery photos';end if;
 for item in select jsonb_array_elements_text(p_config->'gallery') union all select p_config->>'hero' union all select p_config->>'music' loop
  if coalesce(item,'')<>'' and not (item like 'https://%' or item like 'storage:%' or (left(item,1)='/' and left(item,2)<>'//')) then raise exception 'Use HTTPS URLs or uploaded media';end if;
 end loop;
 if coalesce(p_config->>'mapUrl','')<>'' and (p_config->>'mapUrl') not like 'https://%' then raise exception 'Use an HTTPS directions link';end if;
 perform pg_advisory_xact_lock(hashtext('christening-content-publication'));
 if p_publish then update content_versions set state='archived' where state='published';insert into content_versions(config,state) values(p_config,'published');end if;
 delete from content_versions where state='draft';
 insert into content_versions(config,state) values(p_config,'draft');
end $$;
revoke all on function public.save_invitation_content(jsonb,boolean) from public,anon;
grant execute on function public.save_invitation_content(jsonb,boolean) to authenticated;
