# AppForge — Setup Checklist for sstoken.space

## 1. GitHub
- Repo: https://github.com/dracorisz/appforge
- Run locally:
  ```bash
  git remote -v
  # should show: https://github.com/dracorisz/appforge.git
  git push -u origin main
  ```

## 2. Vercel
1. Open https://vercel.com/new
2. Import `dracorisz/appforge`
3. Add these **Environment Variables** in Vercel project settings:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon/public key
   - `MYSQL_HOST` = your MySQL host
   - `MYSQL_PORT` = `3306`
   - `MYSQL_USER` = your MySQL user
   - `MYSQL_PASSWORD` = your MySQL password
   - `MYSQL_DATABASE` = `appforge`
4. Add custom domain: `sstoken.space` (and `www.sstoken.space`)

## 3. Supabase
1. Open https://supabase.com/dashboard
2. Create new project or open existing
3. Copy these values from **Project Settings > API**:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret, do not expose to client)

## 4. MySQL
Use your existing MySQL provider and copy:
- Host → `MYSQL_HOST`
- Port → `MYSQL_PORT`
- Username → `MYSQL_USER`
- Password → `MYSQL_PASSWORD`
- Database name → `MYSQL_DATABASE`

Run schema once:
```bash
npm run db:setup
```

## 5. Namecheap DNS
In Namecheap > Domain List > Manage > Advanced DNS:
- Add A record: `@` → `76.76.21.21`
- Add CNAME record: `www` → `cname.vercel-dns.com`

## 6. Verify
```bash
bash scripts/verify-deployment.sh
```

Then open https://sstoken.space
