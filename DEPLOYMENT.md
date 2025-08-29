# Minimarket ARAMAC Deployment Guide

## Overview

Dual-branch deployment system with automatic CI/CD:
- **`dev` branch** → Random Vercel URLs (development environment)
- **`main` branch** → `minimarket.aramac.dev` (production environment)

## Branch Strategy

### Development Branch (`dev`)
- **Purpose**: Feature development, testing, experimentation
- **Deployment**: Automatic on push to `dev`
- **URL**: Random Vercel URLs (e.g., `minimarket-aramac-git-dev-username.vercel.app`)
- **Environment**: Development settings, debug enabled
- **Robots**: Blocked from search engines

### Production Branch (`main`)
- **Purpose**: Stable, production-ready code
- **Deployment**: Automatic on push to `main`
- **URL**: `https://minimarket.aramac.dev`
- **Environment**: Production settings, optimized
- **Robots**: Indexed by search engines

## Deployment Commands

### Quick Commands
```bash
# Deploy development
npm run deploy:dev

# Deploy production
npm run deploy:prod

# Setup deployment (first time)
npm run deploy:setup
```

### Manual Deployment
```bash
# Development
git checkout dev
git push origin dev
vercel --prod --config vercel.dev.json

# Production
git checkout main
git merge dev
git push origin main
vercel --prod --config vercel.prod.json
```

## Environment Configuration

### Required Environment Variables

#### Development (`vercel.dev.json`)
```
CONVEX_URL_DEV=https://your-dev-convex-url
CONVEX_DEPLOY_KEY_DEV=your-dev-deploy-key
CLERK_PUBLISHABLE_KEY_DEV=pk_test_your-dev-key
CLERK_SECRET_KEY_DEV=sk_test_your-dev-key
CLERK_WEBHOOK_SECRET_DEV=whsec_your-dev-webhook
```

#### Production (`vercel.prod.json`)
```
CONVEX_URL_PROD=https://your-prod-convex-url
CONVEX_DEPLOY_KEY_PROD=your-prod-deploy-key
CLERK_PUBLISHABLE_KEY_PROD=pk_live_your-prod-key
CLERK_SECRET_KEY_PROD=sk_live_your-prod-key
CLERK_WEBHOOK_SECRET_PROD=whsec_your-prod-webhook
```

### Vercel Environment Setup

1. **Development Project**:
   - Create separate Vercel project for development
   - Link to `dev` branch
   - Set environment variables with `_DEV` suffix

2. **Production Project**:
   - Create separate Vercel project for production
   - Link to `main` branch
   - Set environment variables with `_PROD` suffix
   - Configure custom domain: `minimarket.aramac.dev`

## GitHub Actions CI/CD

Automatic deployment workflow (`.github/workflows/deploy.yml`):

### On Push to `dev`:
1. ✅ Quality checks (lint, type-check, build)
2. 🚀 Deploy to development environment
3. 📧 Slack/Discord notification (optional)

### On Push to `main`:
1. ✅ Quality checks (lint, type-check, build)
2. 🚀 Deploy to production environment
3. 📧 Notification with production URL

### Required GitHub Secrets:
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID_DEV=dev-project-id
VERCEL_PROJECT_ID_PROD=prod-project-id
```

## Domain Configuration

### Custom Domain Setup (`minimarket.aramac.dev`)

1. **DNS Configuration**:
   ```
   Type: CNAME
   Name: minimarket
   Value: cname.vercel-dns.com
   ```

2. **Vercel Domain Setup**:
   - Go to Vercel Dashboard → Project → Settings → Domains
   - Add domain: `minimarket.aramac.dev`
   - Verify ownership
   - Enable automatic HTTPS

3. **SSL Certificate**:
   - Automatic via Vercel (Let's Encrypt)
   - Renewal handled automatically

## Development Workflow

### Feature Development
```bash
# 1. Switch to dev branch
git checkout dev
git pull origin dev

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Develop and test locally
npm run dev

# 4. Quality checks
npm run lint
npm run type-check

# 5. Merge to dev and deploy
git checkout dev
git merge feature/your-feature
git push origin dev
# Automatic deployment to dev environment

# 6. Test on dev environment
# Visit deployed dev URL

# 7. Merge to production when ready
git checkout main
git merge dev
git push origin main
# Automatic deployment to production
```

## Security Headers

### Development Environment
- `X-Robots-Tag: noindex, nofollow` (prevent indexing)
- Basic security headers

### Production Environment
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Monitoring & Health Checks

### Health Check Endpoint
- **URL**: `/api/health`
- **Purpose**: Vercel deployment verification
- **Response**: System status, dependencies

### Monitoring Tools
- **Vercel Analytics**: Built-in performance monitoring
- **Lighthouse CI**: Automated performance testing
- **Error Tracking**: Built into error-boundary.tsx

## Rollback Strategy

### Quick Rollback
```bash
# If production deployment fails
git checkout main
git reset --hard HEAD~1  # Go back one commit
git push origin main --force

# Or use Vercel dashboard
# Go to Deployments → Select previous stable deployment → Promote
```

### Emergency Rollback
- Use Vercel dashboard to instantly promote previous deployment
- DNS changes take 5-10 minutes to propagate

## Performance Optimization

### Build Optimizations
- **Bundle Analysis**: `npm run analyze`
- **Unused Dependencies**: `npm run analyze:unused`
- **Tree Shaking**: Automatic via Next.js
- **Image Optimization**: Next.js Image component

### Deployment Optimizations
- **Edge Runtime**: Enabled for API routes
- **Incremental Static Regeneration**: For product pages
- **Static Asset Optimization**: Automatic compression

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   npm run type-check  # Check TypeScript errors
   npm run lint        # Check ESLint issues
   npm run build       # Local build test
   ```

2. **Environment Variable Issues**:
   - Check Vercel dashboard environment variables
   - Verify variable names match configuration
   - Ensure production/development separation

3. **Domain Issues**:
   - Verify DNS configuration
   - Check Vercel domain settings
   - Wait for DNS propagation (up to 24 hours)

### Useful Commands
```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Local environment simulation
vercel dev

# Environment variable management
vercel env ls
vercel env add
```

## Security Best Practices

### Environment Separation
- ✅ Separate Clerk applications (dev/prod)
- ✅ Separate Convex deployments (dev/prod)
- ✅ Different API keys per environment
- ✅ Webhook endpoints per environment

### Access Control
- 🔒 Production environment variables encrypted
- 🔒 Limited access to production deployments
- 🔒 GitHub branch protection rules
- 🔒 Review requirements for main branch

### Monitoring
- 📊 Real-time error tracking
- 📊 Performance monitoring
- 📊 Security header validation
- 📊 SSL certificate monitoring

---

## Quick Reference

### URLs
- **Development**: Random Vercel URL (changes with deployment)
- **Production**: https://minimarket.aramac.dev

### Commands
```bash
npm run deploy:dev     # Deploy development
npm run deploy:prod    # Deploy production
npm run deploy:setup   # First-time setup
```

### Support
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Actions**: Repository → Actions tab
- **Documentation**: This file (DEPLOYMENT.md)