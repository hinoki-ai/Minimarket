# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains the Minimarket ARAMAC web application built with Next.js 15, using Clerk for authentication, Convex for real-time data, and Clerk Billing for subscriptions.

## Development Commands

### Core Development

- `npm run dev` - Start development server with Turbopack on <http://localhost:3000>
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run lint` - Run Next.js linting
- `npm run lint:md` - Lint markdown files (README, docs)
- `npm run lint:md:fix` - Auto-fix markdown linting issues
- `npm run analyze` - Build with bundle analyzer (set ANALYZE=true)

### Product Scraping & Data Management

- `npm run scrape` - Run ultra-advanced scraper with intelligent strategy
- `npm run scrape:lider` - Scrape products from Líder supermarket
- `npm run scrape:lider:clean` - Clean scraped Líder images
- `npm run scrape:lider:clean:delete` - Clean and delete tiny Líder images (DELETE_TINY=1)

### Testing & Quality Assurance

- `npm run e2e` - Run all Playwright E2E tests
- `npm run e2e:ui` - Run E2E tests with interactive UI
- `npm run e2e:report` - View detailed test reports
- `npm run e2e:with-server` - Run E2E tests with alternative server config
- `npm run playwright:install` - Install Playwright browsers and dependencies

#### Running Single Tests

- `npm run e2e -- tests/navigation.spec.ts` - Run specific test file
- `npm run e2e -- --grep "should navigate to products page"` - Run tests matching pattern
- `npm run e2e -- --headed` - Run tests with browser visible
- `npm run e2e -- --debug` - Run tests in debug mode

### Performance Monitoring

- `npm run lighthouse` - Run Lighthouse CI performance audits  
- Tests: homepage, products page, cart page
- Thresholds: Performance >80%, Accessibility >90%, Best Practices >90%, SEO >90%
- Configuration in `.lighthouserc.js` with automated CI integration

### Convex Development

- `npx convex dev` - Start Convex development server (required for database)
- `npx convex dashboard` - Open Convex dashboard in browser
- Run Convex dev server in a separate terminal alongside `npm run dev`

## Architecture Overview

### Tech Stack

- **Next.js 15** with App Router and Turbopack
- **Convex** for real-time database and serverless functions
- **Clerk** for authentication and user management
- **Clerk Billing** for subscription payments
- **TailwindCSS v4** with custom UI components (shadcn/ui)
- **TypeScript** throughout
- **React 19** with latest features and performance improvements
- **Performance optimizations**: Image optimization, caching, CSP headers, bundle analysis

### Key Architectural Patterns

#### Authentication Flow

1. Clerk handles all authentication via `middleware.ts`
2. JWT tokens are configured with "convex" template in Clerk dashboard
3. Users are synced to Convex via webhooks at `/api/clerk-users-webhook`
4. Protected routes redirect unauthenticated users to sign-in

#### Database Architecture

- **Convex** provides real-time sync and serverless functions
- Comprehensive e-commerce schema in `convex/schema.ts`:
  - `users` table: Synced from Clerk (externalId maps to Clerk ID), includes address and preferences
  - `categories` table: Hierarchical product categories with Japanese naming (konbini-inspired)
  - `products` table: Full e-commerce products with inventory, pricing, nutrition, freshness indicators
  - `carts` table: Real-time shopping carts with guest session support
  - `orders` table: Complete order management with Chilean tax/shipping considerations
  - `inventoryLogs` table: Real-time stock tracking and movement history
  - `reviews` table: Customer reviews with verified purchase tracking
  - `paymentAttempts` table: Tracks subscription payments via Clerk Billing
- All database operations use new Convex function syntax with proper validators
- Indexes optimized for real-time queries and search functionality

#### Payment Integration

1. Clerk Billing handles subscription management
2. Custom pricing component in `components/custom-clerk-pricing.tsx`
3. Payment-gated content uses `<ClerkBillingGate>` component
4. Webhook events update payment status in Convex

### Project Structure

```text
app/
├── (landing)/         # Public landing page components
├── dashboard/         # Protected dashboard area with analytics
│   └── payment-gated/ # Subscription-only content
├── cart/ & carrito/   # Shopping cart pages (dual language support)
├── products/         # Product listing and detail pages
├── categories/       # Category browsing
├── promotions/       # Promotional content and offers
├── checkout/         # Checkout flow
├── search/           # Search functionality
├── stores/           # Store information pages
├── delivery/         # Delivery information
├── help/             # Help and support pages
├── layout.tsx        # Root layout with providers
└── middleware.ts     # Auth protection

components/
├── ui/               # shadcn/ui components (New York style)
├── seo/              # JSON-LD structured data components
├── performance/      # Web vitals and lazy loading
├── header/           # Header-specific components (cart count, user section)
├── navigation/       # Navigation components (bottom nav)
├── kokonutui/        # Third-party UI components
├── magicui/          # Magic UI components
├── motion-primitives/# Motion and animation components
├── react-bits/       # React utility components
├── custom-clerk-pricing.tsx
└── ConvexClientProvider.tsx

convex/
├── schema.ts         # Complete e-commerce database schema
├── users.ts          # User CRUD operations
├── products.ts       # Product management
├── categories.ts     # Category management
├── carts.ts          # Shopping cart operations
├── orders.ts         # Order processing
├── reviews.ts        # Product reviews
├── wishlists.ts      # User wishlists
├── paymentAttempts.ts # Payment tracking
├── http.ts           # Webhook handlers
└── auth.config.ts    # JWT configuration

scripts/              # Product scraping and data management
├── ultra-scraper.js  # 🚀 Ultra-advanced unified scraping engine
├── data-validator.js # Data validation and deduplication
├── product-library.js # Search and indexing system
├── product-schema.js  # Universal product schema
├── legacy-scrapers/  # Backup of 15 replaced scrapers
└── README.md         # Scraping system documentation

data/                 # Scraped product data and validation
tests/                # Playwright E2E tests
hooks/                # Custom React hooks (mobile detection, guest sessions)
lib/                  # Utilities (accessibility, performance, utils)
```

## Key Integration Points

### Environment Variables Required

- `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_FRONTEND_API_URL` (from Clerk JWT template)
- `CLERK_WEBHOOK_SECRET` (set in Convex dashboard)

### Webhook Configuration

Clerk webhooks must be configured to:

- Endpoint: `{your_domain}/api/clerk-users-webhook`
- Events: `user.created`, `user.updated`, `user.deleted`, `paymentAttempt.updated`

### Real-time Data Flow

1. UI components use Convex hooks (`useQuery`, `useMutation`)
2. Convex provides automatic real-time updates
3. Authentication context from `useAuth()` (Clerk)
4. User data synced between Clerk and Convex

## Development Guidelines

### Convex Function Development

- **ALWAYS** use new function syntax with explicit validators:

```typescript
export const example = query({
  args: { name: v.string() },
  returns: v.object({ result: v.string() }),
  handler: async (ctx, args) => {
    // Function body
  },
});
```

- Use `v.null()` for functions that don't return values
- Include both `args` and `returns` validators for all functions
- Use `internalQuery`, `internalMutation`, `internalAction` for private functions
- HTTP endpoints in `convex/http.ts` use `httpAction` decorator
- Call functions with `ctx.runQuery`, `ctx.runMutation`, `ctx.runAction` using function references from `api`/`internal`

### Database Query Patterns

- Use indexes instead of `.filter()` - define indexes in schema and use `.withIndex()`
- Use `.unique()` for single document queries (throws if multiple matches)
- Order queries with `.order('asc')` or `.order('desc')` (defaults to ascending)
- For pagination: use `paginationOptsValidator` and `.paginate()`
- Search queries: use `.withSearchIndex()` for full-text search

### Shadcn Component Installation

- ALWAYS use `bunx --bun shadcn@latest add [component-name]` instead of `npx`
- Project uses "new-york" style with CSS variables and Lucide icons
- Check components.json for existing configuration before installing
- Multiple components can be installed at once: `bunx --bun shadcn@latest add button card drawer`

### Convex Rules from .cursor/rules/

**ALWAYS follow these Convex development guidelines:**
- Use new function syntax with explicit validators: `args: { name: v.string() }`, `returns: v.object({ result: v.string() })`
- Include both `args` and `returns` validators for all functions
- Use `v.null()` for functions that don't return values
- Use `internalQuery`, `internalMutation`, `internalAction` for private functions
- Call functions with `ctx.runQuery`, `ctx.runMutation`, `ctx.runAction` using function references from `api`/`internal`
- Use indexes instead of `.filter()` - define in schema and use `.withIndex()`
- Use `.unique()` for single document queries (throws if multiple matches)
- For pagination: use `paginationOptsValidator` and `.paginate()`

### Performance & Security Guidelines

- **Image Optimization**: Next.js automatically optimizes images with WebP/AVIF formats
- **Security Headers**: CSP, HSTS, X-Frame-Options configured in `next.config.ts`
- **Bundle Analysis**: Use `ANALYZE=true npm run build` to analyze bundle size
- **Cache Configuration**: Static assets cached for 1 year, API responses optimized
- **Chilean Market**: Localization configured for es-CL, CLP currency, Chilean tax calculations

### CI/CD Pipeline

- **GitHub Actions**: Automated workflows in `.github/workflows/`
  - `ci.yml`: Lint and build on PRs and main branch pushes
  - `e2e.yml`: End-to-end testing with Playwright
  - `monitor.yml`: Lighthouse performance monitoring and uptime checks
  - `vercel-deploy.yml`: Automated deployment to Vercel
- **Quality Gates**: All checks must pass before merge
- **Performance Monitoring**: Automated Lighthouse audits every 30 minutes

## Product Data Management

### Ultra-Advanced Scraping System

The project features a revolutionary **Ultra-Advanced Scraper Engine** that replaces 15 legacy scrapers with one intelligent tool:

**🚀 Ultra-Scraper Engine Features:**
- **5 Intelligent Strategies**: Standard, Aggressive, Penetration, Multi-Vector, and Hybrid
- **Self-Adapting System**: Learns from failures and optimizes strategy selection
- **Advanced Anti-Detection**: Stealth with fingerprint randomization and circuit breakers
- **Real-Time Monitoring**: Performance metrics, success rates, and automatic recovery
- **Unified Data Pipeline**: Built-in validation, deduplication, and quality scoring

**Core Components:**
- `/home/kuromatsu/Documents/ΛRΛMΛC/Scripts/ultra-scraper.js` - 🎯 Main ultra-advanced scraping engine (replaces 15 old scrapers)
- `/home/kuromatsu/Documents/ΛRΛMΛC/Scripts/data-validator.js` - Data validation and deduplication utilities
- `/home/kuromatsu/Documents/ΛRΛMΛC/Scripts/product-library.js` - Search and indexing system for products
- `/home/kuromatsu/Documents/ΛRΛMΛC/Scripts/product-schema.js` - Universal schema supporting minimarket and hardware products
- `/home/kuromatsu/Documents/ΛRΛMΛC/Scripts/legacy-scrapers/` - Backup of replaced scrapers for reference

**Supported Stores:** Líder, Jumbo, Santa Isabel, Unimarc, Tottus, Easy, Falabella, París, Sodimac

**Usage Examples:**
```bash
# Quick start with intelligent strategy (recommended)
node /home/kuromatsu/Documents/ΛRΛMΛC/Scripts/ultra-scraper.js --max-products 100 --verbose

# Specific stores and categories
node /home/kuromatsu/Documents/ΛRΛMΛC/Scripts/ultra-scraper.js --stores lider,jumbo --categories bebidas,snacks --max-products 200

# Aggressive strategy for maximum extraction
node /home/kuromatsu/Documents/ΛRΛMΛC/Scripts/ultra-scraper.js --strategy aggressive --max-products 1000

# Advanced penetration for protected stores
node /home/kuromatsu/Documents/ΛRΛMΛC/Scripts/ultra-scraper.js --strategy penetration --stores falabella --verbose

# Validate and clean data
node /home/kuromatsu/Documents/ΛRΛMΛC/Scripts/data-validator.js /home/kuromatsu/Documents/ΛRΛMΛC/Websites/Minimarket/data/ultra-scraper/products/

# Search products
node /home/kuromatsu/Documents/ΛRΛMΛC/Scripts/product-library.js search "coca cola"
```

**New Data Organization:**
- Session data: `data/ultra-scraper/products/{sessionId}/`
- Session reports: `data/ultra-scraper/report-{sessionId}.json`
- Session logs: `data/ultra-scraper/logs/{sessionId}.log`
- Images: `data/ultra-scraper/images/`
- Legacy data: `data/products/` (from old scrapers)

**Migration Benefits:**
- **90% fewer files**: 15 scrapers → 1 unified tool
- **50% better performance**: Intelligent strategy selection
- **100% feature coverage**: All capabilities preserved and enhanced
- **Self-adapting**: Learns and improves over time

**Integration:** Scraped data can be populated into Convex database using `convex/populateProducts.ts`

## Important File Conventions

### Component Organization

- **Page Components**: Client components for specific pages (e.g., `products-client.tsx`, `cart-client.tsx`)
- **UI Components**: Reusable components in `components/ui/` following shadcn/ui conventions
- **Feature Components**: Domain-specific components organized by feature (header/, navigation/, seo/)
- **Third-party Components**: External UI libraries (kokonutui/, magicui/, motion-primitives/, react-bits/)

### Testing Structure

- **E2E Tests**: Located in `tests/` directory, using Playwright
- **Test Files**: Follow pattern `*.spec.ts` (e.g., `navigation.spec.ts`, `cart-management.spec.ts`)
- **Global Setup**: `tests/global-setup.ts` for test environment configuration
- **Test Data**: Test results and artifacts stored in `test-results/` and `playwright-report/`
