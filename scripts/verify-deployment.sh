#!/bin/bash
# AppForge Deployment Verification Script
# Usage: bash scripts/verify-deployment.sh

set -e

echo "🔍 Verifying AppForge deployment..."
echo ""

# Check environment variables
echo "1. Checking environment variables..."
if [ -f .env ]; then
  echo "   ✓ .env file exists"
  source .env
else
  echo "   ⚠ .env file not found, using .env.example as reference"
fi

# Check required variables
REQUIRED_VARS=("VITE_SUPABASE_URL" "MYSQL_HOST" "VERCEL_TOKEN")
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "   ⚠ $var is not set"
  else
    echo "   ✓ $var is set"
  fi
done

echo ""
echo "2. Checking build..."
if npm run build > /dev/null 2>&1; then
  echo "   ✓ Build successful"
else
  echo "   ✗ Build failed"
  exit 1
fi

echo ""
echo "3. Checking Vercel deployment..."
if command -v vercel &> /dev/null; then
  vercel --version > /dev/null 2>&1 && echo "   ✓ Vercel CLI installed" || echo "   ⚠ Vercel CLI not installed"
else
  echo "   ⚠ Vercel CLI not installed. Install with: npm i -g vercel"
fi

echo ""
echo "4. Checking database connection..."
if [ -n "$MYSQL_HOST" ]; then
  echo "   MySQL host: $MYSQL_HOST"
  echo "   MySQL database: $MYSQL_DATABASE"
  echo "   Run: npm run db:setup"
else
  echo "   ⚠ MySQL not configured in .env"
fi

echo ""
echo "5. Checking Supabase connection..."
if [ -n "$VITE_SUPABASE_URL" ]; then
  echo "   ✓ Supabase URL configured"
else
  echo "   ⚠ Supabase URL not configured"
fi

echo ""
echo "6. Checking Git setup..."
if git remote -v > /dev/null 2>&1; then
  echo "   Git remotes:"
  git remote -v | sed 's/^/     /'
else
  echo "   ⚠ No git remotes configured"
  echo "   Run: git remote add origin https://github.com/YOUR_USERNAME/appforge.git"
fi

echo ""
echo "7. Deployment checklist:"
echo "   [ ] Push code to GitHub"
echo "   [ ] Set Vercel environment variables"
echo "   [ ] Configure Supabase project"
echo "   [ ] Set up MySQL database"
echo "   [ ] Configure Namecheap DNS:"
echo "       - Type: A, Host: @, Value: 76.76.21.21 (Vercel IP)"
echo "       - Type: CNAME, Host: www, Value: cname.vercel-dns.com"
echo "   [ ] Add custom domain in Vercel: sstoken.space"
echo "   [ ] Verify deployment at https://sstoken.space"
echo ""
echo "✅ Verification complete!"
