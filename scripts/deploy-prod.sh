#!/bin/bash

# Deploy to production environment (main branch) 
# Uses custom domain minimarket.aramac.dev

set -e

echo "🚀 Deploying to PRODUCTION environment..."

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Switching to main branch..."
    git checkout main
fi

# Merge dev into main
echo "🔄 Merging dev branch into main..."
git merge dev --no-edit

# Ensure we have the latest changes
echo "📥 Pushing to origin..."
git push origin main

# Quality checks
echo "🔍 Running production quality checks..."
npm run lint
npm run type-check

# Build test
echo "🔨 Testing production build..."
npm run build

# Deploy with production configuration
echo "🚀 Deploying to Vercel (production)..."
if [ -f "vercel.prod.json" ]; then
    vercel --prod --config vercel.prod.json
else
    echo "❌ vercel.prod.json not found"
    exit 1
fi

echo "✅ Production deployment completed!"
echo "🌐 Your app is now live at https://minimarket.aramac.dev"
echo "🔍 Monitor deployment: https://vercel.com/dashboard"