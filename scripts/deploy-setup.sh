#!/bin/bash

# Minimarket ARAMAC Deployment Setup Script
# Configures dual-branch deployment: dev -> random Vercel URLs, main -> minimarket.aramac.dev

set -e

echo "🚀 Setting up Minimarket ARAMAC deployment configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo -e "  • ${GREEN}dev branch${NC} → Random Vercel URLs (development)"
echo -e "  • ${GREEN}main branch${NC} → minimarket.aramac.dev (production)"
echo ""

# Setup development project
echo -e "${BLUE}🔧 Setting up development project...${NC}"
if [ -f "vercel.dev.json" ]; then
    echo -e "  ✅ vercel.dev.json configured"
else
    echo -e "  ${RED}❌ vercel.dev.json not found${NC}"
    exit 1
fi

# Setup production project  
echo -e "${BLUE}🔧 Setting up production project...${NC}"
if [ -f "vercel.prod.json" ]; then
    echo -e "  ✅ vercel.prod.json configured"
else
    echo -e "  ${RED}❌ vercel.prod.json not found${NC}"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${GREEN}$CURRENT_BRANCH${NC}"

# Environment setup
echo -e "${BLUE}🔐 Environment Configuration:${NC}"
echo -e "  Remember to set these Vercel environment variables:"
echo -e "  ${YELLOW}Development:${NC}"
echo -e "    - CONVEX_URL_DEV"
echo -e "    - CONVEX_DEPLOY_KEY_DEV"
echo -e "    - CLERK_PUBLISHABLE_KEY_DEV"
echo -e "    - CLERK_SECRET_KEY_DEV"
echo -e "    - CLERK_WEBHOOK_SECRET_DEV"
echo ""
echo -e "  ${YELLOW}Production:${NC}"
echo -e "    - CONVEX_URL_PROD"
echo -e "    - CONVEX_DEPLOY_KEY_PROD"
echo -e "    - CLERK_PUBLISHABLE_KEY_PROD"
echo -e "    - CLERK_SECRET_KEY_PROD"  
echo -e "    - CLERK_WEBHOOK_SECRET_PROD"
echo ""

# Git configuration check
echo -e "${BLUE}📖 Git Configuration:${NC}"
git remote -v | head -2

# Deployment commands
echo -e "${BLUE}🚀 Deployment Commands:${NC}"
echo -e "  ${GREEN}Development:${NC}"
echo -e "    git push origin dev"
echo -e "    vercel --prod --config vercel.dev.json"
echo ""
echo -e "  ${GREEN}Production:${NC}"
echo -e "    git checkout main"
echo -e "    git merge dev"
echo -e "    git push origin main"
echo -e "    vercel --prod --config vercel.prod.json"
echo ""

echo -e "${GREEN}✅ Deployment setup completed!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "  1. Configure environment variables in Vercel dashboard"
echo -e "  2. Set up custom domain minimarket.aramac.dev"
echo -e "  3. Test deployment on both branches"
echo -e "  4. Configure DNS settings"