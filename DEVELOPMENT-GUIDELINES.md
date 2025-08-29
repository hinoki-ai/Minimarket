# 🤖 MINIMARKET DEVELOPMENT GUIDELINES

## 🎯 AI ASSISTANT CONTEXT (REQUIRED)

**🚫 CRITICAL RULE**: NEVER TOUCH CLAUDE.md - Contains human-specific context
**🤖 AI-ONLY ACCESS**: This documentation is AI-optimized and accessible
**🎯 PROJECT TYPE**: Next.js e-commerce platform with Vercel deployment
**🏗️ ARCHITECTURE**: Modular system with AI-optimized features
**⚡ CRITICAL REQUIREMENTS**: Spanish-first approach, performance optimization
**🚀 EXECUTION WORKFLOWS**: Automated deployment, environment separation
**📋 IMPLEMENTATION PATTERNS**: Vercel best practices, environment management
**🧪 VALIDATION PROCEDURES**: Automated testing, deployment verification

## 🚨 CRITICAL BRANCHING & ENVIRONMENT RULES (MANDATORY)

### 🔒 Git Branching Strategy (TWO BRANCHES ONLY)

**🚫 CRITICAL RULE**: We maintain EXACTLY TWO branches: `prod` and `dev`

- **prod** branch: Production-ready code, deployed to `minimarket.aramac.dev`
- **dev** branch: Development branch for all feature work and testing

**🚫 NEVER CREATE ADDITIONAL BRANCHES** - This creates confusion and deployment complexity

#### 📋 Complete Development Workflow

```bash
# 🔄 START: Always begin on dev branch
git checkout dev
git pull origin dev --rebase
git status

# 🔧 DEVELOPMENT: Make your changes with proper commits
git add .
git commit -m "feat: [brief description of changes]"
git push origin dev

# 🧪 TESTING: Test thoroughly before production
npm run build
npm run test
# Manual testing in browser
# Check all critical functionality

# 🚀 PRODUCTION DEPLOYMENT
git checkout prod
git merge dev --no-ff -m "deploy: merge dev to prod [date]"
git push origin prod

# 🔙 RETURN TO DEVELOPMENT
git checkout dev
```

#### 🚨 Emergency Procedures

**🔥 Hotfix Required**:
```bash
# If production is broken and needs immediate fix
git checkout prod
git cherry-pick [specific-commit-hash]  # Only cherry-pick tested commits
git push origin prod
# Immediately merge hotfix back to dev
git checkout dev
git merge prod
git push origin dev
```

**⏪ Rollback Procedure**:
```bash
# If deployment breaks production
git checkout prod
git reset --hard HEAD~1  # Rollback to previous commit
git push origin prod --force
# Investigate issue on dev branch
```

### 🔑 Environment File Management (STRICT RULES)

**🚫 CRITICAL SECURITY RULES**:

1. **NEVER CREATE MORE ENV FILES** - We use `.env.local` ONLY for local development
2. **NEVER RENAME ENV FILES** - Keep `.env.local` as is
3. **NEVER MODIFY LAYOUT WITHOUT APPROVAL** - Layout changes require explicit approval
4. **BE EXTREMELY CAREFUL WITH KEYS** - All API keys, secrets, and sensitive data
5. **NEVER COMMIT ENV FILES** - They must remain local only

#### 📁 Environment File Structure (MANDATORY)

```
.env.local                    # ONLY env file for local development
├── # Convex Configuration
├── CONVEX_URL="https://your-dev-convex-url"
├── CONVEX_DEPLOY_KEY="your-dev-deploy-key"
├──
├── # Clerk Authentication
├── CLERK_PUBLISHABLE_KEY="pk_test_your-dev-key"
├── CLERK_SECRET_KEY="sk_test_your-dev-key"
├── CLERK_WEBHOOK_SECRET="whsec_your-dev-webhook"
├──
├── # Development Settings
├── NODE_ENV="development"
├── NEXT_PUBLIC_APP_URL="http://localhost:3000"
└── NEXT_PUBLIC_ENVIRONMENT="development"
```

#### 🔐 Security Best Practices

**✅ BEFORE Adding New Environment Variables**:
- [ ] Document the purpose and usage
- [ ] Verify it's actually needed
- [ ] Check if it can be derived from existing vars
- [ ] Test locally before committing code that uses it

**✅ WHEN Modifying Existing Keys**:
- [ ] Backup current working keys
- [ ] Test new keys in development first
- [ ] Have rollback plan ready
- [ ] Notify team of changes

**🚫 FORBIDDEN ACTIONS**:
- ❌ Creating `.env.production`, `.env.staging`, `.env.dev`
- ❌ Creating `.env.local.backup` or similar
- ❌ Renaming `.env.local` to anything else
- ❌ Modifying layout files without approval
- ❌ Committing any `.env*` files to git
- ❌ Sharing environment files via email/chat
- ❌ Using production keys in local development

**✅ APPROVED ACTIONS**:
- ✅ Update `.env.local` with new required variables (document first)
- ✅ Modify existing keys (with extreme caution and backup)
- ✅ Request approval for layout changes before implementing
- ✅ Use environment variables for all sensitive data

### 🚀 Vercel Deployment Integration

#### Dual Project Setup (RECOMMENDED)

**Development Project** (`dev` branch):
- **Vercel Project**: Separate dev project
- **Environment Variables**: Use `_DEV` suffix
- **Domain**: Random Vercel URL
- **Robots**: `noindex, nofollow`

**Production Project** (`prod` branch):
- **Vercel Project**: Separate prod project
- **Environment Variables**: Use `_PROD` suffix
- **Domain**: `minimarket.aramac.dev`
- **Robots**: Allow indexing

#### Environment Variable Mapping

**Local Development** (`.env.local`):
```
CONVEX_URL=https://dev-convex-url
CLERK_PUBLISHABLE_KEY=pk_test_dev-key
CLERK_SECRET_KEY=sk_test_dev-key
```

**Vercel Development Project**:
```
CONVEX_URL_DEV=https://dev-convex-url
CLERK_PUBLISHABLE_KEY_DEV=pk_test_dev-key
CLERK_SECRET_KEY_DEV=sk_test_dev-key
```

**Vercel Production Project**:
```
CONVEX_URL_PROD=https://prod-convex-url
CLERK_PUBLISHABLE_KEY_PROD=pk_live_prod-key
CLERK_SECRET_KEY_PROD=sk_live_prod-key
```

### ⚠️ Approval & Communication Requirements

#### 📝 Pre-Implementation Requirements

**Layout Modifications**:
- [ ] Written approval from project lead
- [ ] Document impact on existing functionality
- [ ] Provide before/after mockups or diagrams
- [ ] Test on dev environment first

**Environment Changes**:
- [ ] Document all key additions/modifications
- [ ] Provide justification for new variables
- [ ] Include security review checklist
- [ ] Test deployment process

**Production Deployments**:
- [ ] Test thoroughly on dev branch
- [ ] Verify all critical functionality
- [ ] Check performance metrics
- [ ] Have rollback plan ready

#### 📢 Communication Protocol

**Before Major Changes**:
```
Subject: [MINIMARKET] Requesting Approval: [Change Description]

Details:
- What: [Specific changes]
- Why: [Business justification]
- Impact: [Affected systems/features]
- Testing: [Test plan]
- Rollback: [Recovery plan]

@team-lead Please approve/disapprove
```

**After Deployment**:
```
✅ MINIMARKET DEPLOYMENT COMPLETE
- Changes: [Brief summary]
- Dev URL: [Random Vercel URL]
- Prod URL: https://minimarket.aramac.dev
- Status: All systems operational
- Monitoring: [24h watch period]
- Next steps: [Follow-up actions]
```

### 🚨 Emergency Response Procedures

#### 🔥 Critical Production Issues

1. **IMMEDIATE RESPONSE**:
   - Assess severity and impact
   - Notify team immediately
   - Begin rollback if necessary

2. **INVESTIGATION**:
   - Check Vercel deployment logs
   - Check Convex dashboard
   - Check Clerk authentication logs
   - Document findings

3. **RESOLUTION**:
   - Implement fix on dev branch
   - Test thoroughly
   - Deploy to production
   - Monitor for 24 hours

#### 📊 Monitoring & Alerting

**Required Monitoring**:
- Vercel deployment status and logs
- Application uptime and response times
- Error rates and logs
- Clerk authentication flows
- Convex database performance
- API key usage and limits
- Security alerts

**Alert Thresholds**:
- Response time > 3 seconds
- Error rate > 5%
- Database connection failures
- Authentication failures > 10%
- API key exhaustion warnings

### 🛡️ Security Checklist (MANDATORY)

#### 🔐 Pre-Deployment Security Review

- [ ] All sensitive data uses environment variables
- [ ] No hardcoded secrets in codebase
- [ ] Environment files are gitignored
- [ ] API keys have appropriate permissions
- [ ] Database credentials are encrypted
- [ ] CORS settings are production-appropriate
- [ ] HTTPS is enforced
- [ ] Security headers are configured

#### 🔍 Code Security Scan

```bash
# Run before every deployment
npm audit
npm run security-check
# Check for exposed secrets
grep -r "password\|secret\|key" src/ --exclude-dir=node_modules
```

---

## 🎯 MINIMARKET-SPECIFIC WORKFLOWS

### 1. Local Development Setup

```bash
# Clone and setup
git clone [repository-url]
cd minimarket
npm install

# Setup environment
cp .env.example .env.local  # Fill in your keys
npm run dev
```

### 2. Feature Development Process

```bash
# Start new feature
git checkout dev
git pull origin dev

# Create feature implementation
# Test locally with npm run dev

# Quality checks
npm run lint
npm run type-check
npm run build

# Push to dev for deployment testing
git add .
git commit -m "feat: [feature description]"
git push origin dev

# Test on deployed dev environment
# When ready, deploy to production
git checkout prod
git merge dev
git push origin prod
```

### 3. Deployment Verification

**Development Deployment**:
- [ ] Vercel build succeeds
- [ ] All environment variables loaded
- [ ] Convex connection works
- [ ] Clerk authentication works
- [ ] No console errors

**Production Deployment**:
- [ ] All development checks pass
- [ ] Domain resolves correctly
- [ ] SSL certificate valid
- [ ] Robots.txt allows indexing
- [ ] Performance metrics within thresholds

---

## 🔧 DEVELOPMENT TOOLS & SCRIPTS

### Essential Commands

```bash
# Development
npm run dev              # Start local development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint           # Run ESLint
npm run type-check     # TypeScript type checking

# Deployment
npm run deploy:dev     # Deploy to development
npm run deploy:prod    # Deploy to production
npm run deploy:setup   # First-time deployment setup

# Testing
npm run test           # Run test suite
npm run test:e2e       # End-to-end tests

# Analysis
npm run analyze        # Bundle analysis
npm run lighthouse     # Performance testing
```

### Quality Gates

**Pre-commit**:
- [ ] ESLint passes
- [ ] TypeScript compilation succeeds
- [ ] Tests pass
- [ ] No console errors

**Pre-deployment**:
- [ ] Build succeeds
- [ ] Bundle size acceptable
- [ ] Performance metrics good
- [ ] Security scan passes

---

**🚨 ENFORCEMENT**: These rules are MANDATORY for the Minimarket project. Violations will result in immediate code rollback and security review.

**📅 Last Updated**: [Current Date]
**🎯 Project**: Minimarket ARAMAC
**🏗️ Tech Stack**: Next.js, Convex, Clerk, Vercel