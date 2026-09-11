# AppForge — Deployment Guide

## Prerequisites

- Node.js 20+
- npm or yarn
- Git
- Vercel account
- Supabase account
- MySQL database (PlanetScale, Railway, or similar)
- Namecheap domain (sstoken.space)

## 1. GitHub Setup

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: AppForge v1.18.0"

# Add remote (replace with your repo)
git remote add origin https://github.com/YOUR_USERNAME/appforge.git
git branch -M main
git push -u origin main
```

## 2. Vercel Setup

### Option A: Deploy via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel link
vercel --prod
```

### Option B: Deploy via GitHub Integration
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `MYSQL_HOST`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
4. Deploy

## 3. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your project URL and anon key from Project Settings > API
3. Run migrations:
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_ID
   npx supabase db push
   ```
4. Add to Vercel environment variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

## 4. MySQL Setup

### Option A: PlanetScale
1. Create a database at [planetscale.com](https://planetscale.com)
2. Run the schema:
   ```bash
   npm run db:setup
   ```
3. Add to Vercel environment variables:
   - `MYSQL_HOST` = your PlanetScale host
   - `MYSQL_USER` = your username
   - `MYSQL_PASSWORD` = your password
   - `MYSQL_DATABASE` = appforge

### Option B: Railway
1. Create a MySQL plugin at [railway.app](https://railway.app)
2. Get connection details from Railway dashboard
3. Add to Vercel environment variables

## 5. Domain Setup (Namecheap)

1. In Namecheap dashboard, go to Domain List > Manage > Advanced DNS
2. Add these records:
   - **Type**: A, **Host**: @, **Value**: 76.76.21.21 (Vercel IP)
   - **Type**: CNAME, **Host**: www, **Value**: cname.vercel-dns.com
3. In Vercel dashboard:
   - Go to your project > Settings > Domains
   - Add `sstoken.space` and `www.sstoken.space`
   - Vercel will auto-configure SSL

## 6. CI/CD Setup

1. Go to GitHub repository > Settings > Secrets and variables > Actions
2. Add these repository secrets:
   - `VERCEL_TOKEN` = your Vercel token (from vercel.com/account/tokens)
   - `VERCEL_ORG_ID` = your Vercel organization ID
   - `VERCEL_PROJECT_ID` = your Vercel project ID
   - `MYSQL_HOST` = MySQL host
   - `MYSQL_USER` = MySQL username
   - `MYSQL_PASSWORD` = MySQL password
   - `MYSQL_DATABASE` = appforge

3. Push to main branch triggers automatic production deployment

## 7. Verify Deployment

```bash
bash scripts/verify-deployment.sh
```

Visit https://sstoken.space to verify.

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_APP_NAME` | App name | No |
| `VITE_APP_URL` | Production URL | No |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `MYSQL_HOST` | MySQL host | Yes |
| `MYSQL_PORT` | MySQL port (default: 3306) | No |
| `MYSQL_USER` | MySQL username | Yes |
| `MYSQL_PASSWORD` | MySQL password | Yes |
| `MYSQL_DATABASE` | MySQL database name | Yes |
| `VERCEL_TOKEN` | Vercel API token | For CI/CD |
| `VERCEL_ORG_ID` | Vercel org ID | For CI/CD |
| `VERCEL_PROJECT_ID` | Vercel project ID | For CI/CD |

## Project Structure

```
projectpf/
├── src/
│   ├── api/              # Vercel serverless functions
│   ├── components/       # React components
│   ├── lib/              # Utilities, db connection, registry
│   └── types/            # TypeScript types
├── supabase/             # Supabase config
├── scripts/              # Setup and deploy scripts
├── .github/workflows/    # CI/CD pipelines
├── vercel.json           # Vercel configuration
└── .env.example          # Environment variables template
```

## Support

- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- MySQL: [dev.mysql.com/doc](https://dev.mysql.com/doc/)
