# Environment Configuration

This project uses a standardized template system with two environment files.

## Environment Files

### 1. `.env.dev` - Development Environment
- **Purpose**: Local development with test credentials
- **Usage**: `npm run dev` (runs on http://localhost:3000)
- **Convex**: Uses local Convex server (http://localhost:3210)
- **Credentials**: Test keys only

### 2. `.env.prod` - Production Environment
- **Purpose**: Production deployment with live credentials
- **Usage**: Production server only
- **Convex**: Uses production deployment
- **Credentials**: Live production keys (NEVER commit to git!)

## How to Use

### Development:
```bash
# Start local Convex server
npx convex dev

# In another terminal, start Next.js
npm run dev
```

### Production:
```bash
NODE_ENV=production npm run build
```

## Template System

This project's environment files serve as templates for new projects:

- Templates are stored in: `/mnt/Secondary/Projects/Templates/Environment/`
- Use `setup-env.sh` to copy templates to new projects
- See template README for detailed setup instructions

## Security Notes

- **NEVER** commit production credentials to version control
- **NEVER** use production keys in `.env.dev`
- Use your deployment platform's environment variable management for production secrets
- `.env.dev` and `.env.prod` are gitignored and should stay local

## Setup Checklist

- [ ] Copy templates using setup script for new projects
- [ ] Fill in Clerk test keys in `.env.dev`
- [ ] Configure Convex development deployment
- [ ] Set up production environment variables in deployment platform
- [ ] Test both development and production environments
