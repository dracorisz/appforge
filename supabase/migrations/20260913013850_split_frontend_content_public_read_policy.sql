drop policy if exists "public read published frontend content" on public.frontend_content;
create policy "public read published frontend content"
on public.frontend_content for select
to anon, authenticated
using (published = true);

drop policy if exists "aal2 admins read frontend content" on public.frontend_content;
create policy "aal2 admins read frontend content"
on public.frontend_content for select
to authenticated
using ((select public.is_admin_aal2()));
