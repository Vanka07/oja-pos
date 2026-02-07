#!/bin/bash
# Oja POS Deploy Script
# Usage: ./deploy.sh "commit message"

set -e

MSG="${1:-update}"

echo "🛒 Oja POS Deploy"
echo "=================="

# Commit & push
echo "📦 Committing: $MSG"
git add .
git commit -m "$MSG" || echo "Nothing to commit"
git push github main

# Build
echo "🔨 Building web export..."
bun install --frozen-lockfile 2>/dev/null || bun install
npx expo export --platform web

# Prepare dist
echo "📁 Preparing dist..."
cp vercel.json dist/
cp -r public/* dist/ 2>/dev/null || true

# Deploy
echo "🚀 Deploying to Vercel..."
cd dist
vercel --prod --yes

echo ""
echo "✅ Live at https://app.ojapos.app"
