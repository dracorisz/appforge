create table public.media_limits (
 user_id uuid primary key references auth.users(id) on delete cascade,
 limit_bytes bigint not null default 209715200 check(limit_bytes between 0 and 107374182400)
);
create table public.media_files (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null,
 mime text not null,
 size_bytes bigint not null check(size_bytes > 0),
 path text not null unique,
 status text not null default 'reserved' check(status in ('reserved','ready')),
 created_at timestamptz not null default now()
);
alter table public.media_limits enable row level security;
alter table public.media_files enable row level security;
create policy media_limits_read on public.media_limits for select to authenticated using(user_id=auth.uid() or public.is_admin_aal2());
create policy media_limits_admin on public.media_limits for all to authenticated using(public.is_admin_aal2()) with check(public.is_admin_aal2());
create policy media_files_read on public.media_files for select to authenticated using(user_id=auth.uid());
grant select on public.media_files to authenticated;
grant select,insert,update on public.media_limits to authenticated;
grant all on public.media_files, public.media_limits to service_role;
create function public.reserve_media_file(target_user uuid, file_name text, file_mime text, file_bytes bigint)
returns public.media_files language plpgsql security definer set search_path=public as $$
declare cap bigint; used bigint; item public.media_files; fid uuid := gen_random_uuid();
begin
 if coalesce(auth.jwt()->>'role','') <> 'service_role' then raise exception 'Server required'; end if;
 if file_bytes < 1 or file_bytes > 2097152 then raise exception 'File exceeds 2 MB upload limit'; end if;
 insert into media_limits(user_id) values(target_user) on conflict do nothing;
 select limit_bytes into cap from media_limits where user_id=target_user for update;
 select coalesce(sum(size_bytes),0) into used from media_files where user_id=target_user;
 if used + file_bytes > cap then raise exception 'Storage quota exceeded'; end if;
 insert into media_files(id,user_id,name,mime,size_bytes,path) values(fid,target_user,left(file_name,180),file_mime,file_bytes,target_user::text || '/' || fid::text) returning * into item;
 return item;
end; $$;
revoke all on function public.reserve_media_file(uuid,text,text,bigint) from public,anon,authenticated;
grant execute on function public.reserve_media_file(uuid,text,text,bigint) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('user-media','user-media',false,2097152,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict(id) do nothing;
create policy media_private_read on storage.objects for select to authenticated using(bucket_id='user-media' and (storage.foldername(name))[1]=auth.uid()::text);
