#!/bin/bash

# Deploy to development environment (dev branch)
# Uses random Vercel URLs for testing

set -e

echo "🚀 Deploying to DEVELOPMENT environment..."

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "⚠️  Warning: Not on dev branch (currently on $CURRENT_BRANCH)"
    read -p "Switch to dev branch? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout dev
    else
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Ensure we have the latest changes
echo "📥 Pulling latest changes..."
git pull origin dev

# Quality checks
echo "🔍 Running quality checks..."
npm run lint
npm run type-check

# Deploy with development configuration
echo "🚀 Deploying to Vercel (development)..."
if [ -f "vercel.dev.json" ]; then
    vercel --prod --config vercel.dev.json
else
    echo "❌ vercel.dev.json not found"
    exit 1
fi

echo "✅ Development deployment completed!"
echo "🌐 Your app is now live at the Vercel development URL"