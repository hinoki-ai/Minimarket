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

### Testing & Quality Assurance

- `npm run e2e` - Run all Playwright E2E tests
- `npm run e2e:ui` - Run E2E tests with interactive UI
- `npm run e2e:report` - View detailed test reports
- `npm run e2e:with-server` - Run E2E tests with alternative server config
- `npm run playwright:install` - Install Playwright browsers and dependencies

### Performance Monitoring

- `npm run lighthouse` - Run Lighthouse CI performance audits
- Tests: homepage, products page, cart page
- Thresholds: Performance >80%, Accessibility >90%, Best Practices >90%, SEO >90%

### Convex Development

- `npx convex dev` - Start Convex development server (required for database)
- Run this in a separate terminal alongside `npm run dev`

## Architecture Overview

### Tech Stack

- **Next.js 15** with App Router and Turbopack
- **Convex** for real-time database and serverless functions
- **Clerk** for authentication and user management
- **Clerk Billing** for subscription payments
- **TailwindCSS v4** with custom UI components (shadcn/ui)
- **TypeScript** throughout

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
├── cart/             # Shopping cart pages
├── products/         # Product listing and detail pages
├── categories/       # Category browsing
├── checkout/         # Checkout flow
├── search/           # Search functionality
├── layout.tsx        # Root layout with providers
└── middleware.ts     # Auth protection

components/
├── ui/               # shadcn/ui components (New York style)
├── seo/              # JSON-LD structured data components
├── performance/      # Web vitals and lazy loading
├── custom-clerk-pricing.tsx
└── ConvexClientProvider.tsx

convex/
├── schema.ts         # Complete e-commerce database schema
├── users.ts          # User CRUD operations
├── products.ts       # Product management
├── categories.ts     # Category management
├── carts.ts          # Shopping cart operations
├── orders.ts         # Order processing
├── paymentAttempts.ts # Payment tracking
├── http.ts           # Webhook handlers
└── auth.config.ts    # JWT configuration

tests/                # Playwright E2E tests
hooks/               # Custom React hooks (mobile detection, guest sessions)
lib/                 # Utilities (accessibility, performance, utils)
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
