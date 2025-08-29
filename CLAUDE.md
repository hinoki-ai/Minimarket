# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Minimarket ARAMAC is a Next.js e-commerce application for Chilean minimarket products using Convex as the backend. The app features a Japanese-inspired design system with Chilean market adaptation, real-time synchronization, and comprehensive e-commerce functionality.

## Commands

### Development
```bash
# Start development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking and linting
npm run lint
npm run lint:md
npm run lint:md:fix
```

### Testing
```bash
# Run E2E tests
npm run e2e

# Run E2E tests with UI
npm run e2e:ui

# Show test report
npm run e2e:report

# Run E2E tests with server
npm run e2e:with-server
```

### Analysis and Performance
```bash
# Bundle analysis
npm run analyze
npm run analyze:dev
npm run analyze:server
npm run analyze:bundle
npm run analyze:client
npm run analyze:unused

# Performance testing
npm run lighthouse

# Install Playwright dependencies
npm run playwright:install
```

### Data Scraping
```bash
# General scraping commands
npm run scrape
npm run scrape:lider
npm run scrape:lider:clean
npm run scrape:lider:clean:delete
npm run scrape:standardize
```

### Deployment
```bash
# Deploy using custom script
npm run deploy

# Deploy to Vercel
npm run deploy:vercel
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript 5
- **Backend**: Convex for real-time database and functions
- **Authentication**: Clerk for user management
- **Styling**: Tailwind CSS 4.0 with custom design system
- **UI Components**: Radix UI primitives, custom component library
- **Testing**: Playwright for E2E testing
- **Performance**: Lighthouse CI, bundle analysis

### Core Architecture Patterns

#### Convex Backend Structure
The backend uses Convex's file-based function system with comprehensive schemas:
- **Users**: Clerk integration with external ID mapping
- **Products**: Japanese-Chilean fusion catalog with inventory tracking
- **Categories**: Hierarchical structure with Japanese names and Chilean market adaptation
- **Orders**: Complete e-commerce order management with Chilean tax calculations
- **Carts**: Real-time cart synchronization for authenticated and guest users
- **Reviews**: Product review system with verified purchases
- **Inventory**: Real-time stock management with automatic logging

#### Database Schema Key Points
- All tables use proper indexes for query optimization
- Search functionality uses Convex's built-in search indexes
- Chilean market specifics: CLP currency, 19% IVA tax rate
- Japanese-inspired freshness indicators (`isFresh`, `isNew`, `isPopular`)
- Real-time inventory tracking with low stock thresholds

#### Frontend Architecture
- **App Router**: Next.js 15 app directory structure
- **Client Components**: All UI components are client-side with `'use client'`
- **Real-time Data**: Convex queries provide live data synchronization
- **Responsive Design**: Mobile-first with desktop enhancements
- **Performance**: Optimized images, lazy loading, bundle splitting

### File Structure Key Concepts

#### Component Organization
- `src/components/ui/`: Reusable UI primitives (buttons, cards, etc.)
- `src/components/`: Feature-specific components
- `src/components/seo/`: Structured data and SEO components
- `src/components/performance/`: Performance optimization utilities

#### App Directory Routing
- `src/app/(landing)/`: Homepage and marketing pages
- `src/app/products/`: Product catalog and detail pages
- `src/app/cart/` & `src/app/carrito/`: Shopping cart (Spanish redirect)
- `src/app/categories/`: Category browsing with dynamic slugs
- `src/app/search/`: Product search functionality
- `src/app/dashboard/`: Admin/management interface

#### Convex Functions
- **Queries**: `src/convex/*.ts` files for data fetching
- **Mutations**: State-changing operations (cart updates, orders)
- **Actions**: External API calls and complex operations
- **Schema**: `src/convex/schema.ts` defines all database tables

### Development Guidelines

#### Convex Function Patterns
Always use the new Convex function syntax with proper validators:
```typescript
export const functionName = query({
  args: { param: v.string() },
  returns: v.object({ result: v.any() }),
  handler: async (ctx, args) => {
    // Implementation
  },
});
```

#### Component Development
- Use TypeScript interfaces for all prop types
- Implement proper loading states and error handling
- Follow the established naming conventions for CSS classes
- Use Convex hooks for real-time data: `useQuery`, `useMutation`

#### State Management
- Convex handles server state automatically
- Use React state for local UI state
- Cart state is persisted in Convex for real-time sync
- User authentication through Clerk integration

#### Performance Considerations
- Images use Next.js Image component with proper sizing
- Lazy loading for below-the-fold content
- Bundle analysis available via `npm run analyze`
- Lighthouse CI for performance monitoring

### Configuration Files

#### Key Configuration
- `next.config.ts`: Next.js configuration with security headers, redirects, and performance optimizations
- `convex/schema.ts`: Complete database schema with indexes
- `.cursor/rules/convex_rules.mdc`: Convex development guidelines
- `playwright.config.ts`: E2E testing configuration
- `tailwind.config.ts`: Design system configuration

#### Environment Variables
Required environment variables should be documented in `.env.local`:
- Convex deployment URL and keys
- Clerk authentication keys
- Any third-party service credentials

### Japanese-Chilean Design System

The application uses a unique design approach combining Japanese konbini (convenience store) aesthetics with Chilean market needs:
- **Color Coding**: Categories use color coding similar to Japanese convenience stores
- **Freshness Indicators**: Products have Japanese-style freshness labels
- **Typography**: Hierarchical typography with clean, minimal design
- **Responsive**: Mobile-first approach with thumb-friendly interactions

### Testing Strategy

#### E2E Testing with Playwright
- Comprehensive test coverage for user flows
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsive testing
- Performance regression testing
- Tests are located in `tests/` directory

#### Test Execution
- Tests can run with or without a local server
- UI mode available for test development
- Automatic screenshot and video capture on failures
- CI/CD integration ready

### Data Management

#### Product Data Pipeline
- Scraping utilities for Chilean retail websites
- Data standardization and validation
- Bulk import capabilities via Convex mutations
- Image optimization and storage

#### Real-time Features
- Live cart updates across devices
- Real-time inventory tracking
- Instant search results
- Live product availability status

This architecture supports a scalable, performant e-commerce platform with real-time capabilities and a unique design aesthetic tailored to the Chilean minimarket industry.