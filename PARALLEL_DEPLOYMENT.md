# Parallel Development & Production Deployment

This project uses a sophisticated parallel deployment system that allows you to develop features without affecting production.

## 🏗️ Architecture Overview

### Branches
- **`main`** → Production deployment (`https://minimarket.aramac.dev`)
- **`dev`** → Staging deployment (`https://dev.minimarket.aramac.dev`)

### Environment Files
- **`.env.dev`** → Development environment (localhost)
- **`.env.dev.staging`** → Staging environment (dev subdomain)
- **`.env.prod`** → Production environment (production subdomain)

## 🚀 Quick Start

### For Development (localhost)
```bash
# Switch to dev branch
git checkout dev

# Run development server
npm run dev
# Opens: http://localhost:3000
```

### For Staging (dev subdomain)
```bash
# Switch to dev branch
git checkout dev

# Build and deploy to staging
npm run build
npm run deploy
# Deploys to: https://dev.minimarket.aramac.dev
```

### For Production (production subdomain)
```bash
# Switch to main branch
git checkout main

# Build and deploy to production
npm run build
npm run deploy
# Deploys to: https://minimarket.aramac.dev
```

## 🔄 Automated Branch Setup

The project automatically detects your current branch and configures the environment:

### Development Branch (`dev`)
- Uses `.env.dev.staging` for staging deployment
- Vercel config: `vercel.dev.json`
- URL: `https://dev.minimarket.aramac.dev`

### Main Branch (`main`)
- Uses `.env.prod` for production deployment
- Vercel config: `vercel.prod.json`
- URL: `https://minimarket.aramac.dev`

## 📋 Development Workflow

### 1. Start New Feature
```bash
# Always work on dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/new-awesome-feature
```

### 2. Develop Locally
```bash
npm run dev
# Develop at http://localhost:3000
```

### 3. Test on Staging
```bash
# Merge to dev branch
git checkout dev
git merge feature/new-awesome-feature

# Deploy to staging
npm run build
npm run deploy
# Test at https://dev.minimarket.aramac.dev
```

### 4. Deploy to Production
```bash
# Create pull request from dev to main
# Or merge directly
git checkout main
git merge dev

# Deploy to production
npm run build
npm run deploy
# Live at https://minimarket.aramac.dev
```

## ⚙️ Configuration Details

### Environment Variables
Each environment has specific configurations:

**Development (`.env.dev`):**
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
# ... development-specific settings
```

**Staging (`.env.dev.staging`):**
```bash
NEXT_PUBLIC_APP_URL=https://dev.minimarket.aramac.dev
NODE_ENV=production  # Runs as production build
# ... staging-specific settings
```

**Production (`.env.prod`):**
```bash
NEXT_PUBLIC_APP_URL=https://minimarket.aramac.dev
NODE_ENV=production
# ... production-specific settings
```

### Vercel Configurations

**`vercel.dev.json`:**
```json
{
  "version": 2,
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://dev.minimarket.aramac.dev"
  }
}
```

**`vercel.prod.json`:**
```json
{
  "version": 2,
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://minimarket.aramac.dev"
  }
}
```

## 🔧 Manual Configuration

If you need to manually configure the environment:

```bash
# Setup for current branch
npm run setup

# Or manually:
node scripts/setup-branch.sh
```

## 🛡️ Safety Features

### Branch Protection
- **Never commit directly to `main`**
- **Always test on `dev` branch first**
- **Use pull requests for production deployments**

### Environment Isolation
- **Development**: Local environment with test keys
- **Staging**: Remote environment with test keys
- **Production**: Live environment with production keys

### Automatic Detection
- **Scripts detect current branch automatically**
- **Loads appropriate environment files**
- **Configures Vercel settings per branch**

## 🚨 Emergency Procedures

### If Production Breaks
```bash
# Quick rollback
git checkout main
git reset --hard HEAD~1
npm run build
npm run deploy
```

### If Staging Breaks
```bash
# Fix on dev branch
git checkout dev
# Fix issues...
npm run build
npm run deploy
```

## 📊 Deployment Status

- **Development**: `http://localhost:3000` (local)
- **Staging**: `https://dev.minimarket.aramac.dev` (dev branch)
- **Production**: `https://minimarket.aramac.dev` (main branch)

## 🎯 Best Practices

1. **Always work on `dev` branch**
2. **Test thoroughly on staging before production**
3. **Use feature branches for complex changes**
4. **Keep production keys secure**
5. **Document breaking changes**

## 🔗 Integration with Vercel

### Automatic Deployments
- **Push to `dev`**: Deploys to staging
- **Push to `main`**: Deploys to production
- **Pull Request**: Can preview deployments

### Environment Variables
Set these in Vercel dashboard:

**For Production (main branch):**
- `CLERK_PROD_PUBLISHABLE_KEY`
- `CLERK_PROD_SECRET_KEY`
- `CLERK_PROD_WEBHOOK_SECRET`
- `CONVEX_PROD_DEPLOYMENT`
- `CONVEX_PROD_URL`

**For Staging (dev branch):**
- `CLERK_DEV_PUBLISHABLE_KEY`
- `CLERK_DEV_SECRET_KEY`
- `CLERK_DEV_WEBHOOK_SECRET`
- `CONVEX_DEV_DEPLOYMENT`
- `CONVEX_DEV_URL`

This parallel system ensures you can develop safely without risking production stability! 🎉
