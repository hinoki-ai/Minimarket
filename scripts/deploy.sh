#!/bin/bash

# Deploy script for minimarket.aramac.dev
# This script builds and deploys the minimarket app to Vercel

set -e

echo "🚀 Deploying minimarket.aramac.dev..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "next.config.ts" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Build the project
echo "🔨 Building project..."
pnpm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://minimarket.aramac.dev"
echo ""
echo "📝 Next steps:"
echo "1. Add CNAME record: minimarket.aramac.dev → your-vercel-deployment.vercel.app"
echo "2. Verify domain in Vercel dashboard"
echo "3. Update DNS settings if needed" 