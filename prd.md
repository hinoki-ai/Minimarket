# PRD — "El Vecino" Minimarket Website (MVP)

**Language:** English

**Purpose:** This document defines the Product Requirements for the *first implementation* (MVP) of El Vecino — a minimarket website focused on a clean, fast, mobile-first shopping experience for local customers in Chile and LATAM. The goal is to deliver a compact, robust, and *expandable* architecture that follows best practices and can be extended later with more advanced e‑commerce features.

---

## Executive summary

- **Primary objective (MVP):** A fast, reliable product catalog + simple checkout that lets customers browse products, add to cart, and purchase using Stripe. Provide a minimal admin interface for managing products, stock, and orders.
- **Key constraints:** Keep the scope slim for the first implementation. Remove advanced features (multi-gateway, complex shipping integrations, subscriptions, loyalty) and focus on a clean architecture built for expansion.
- **Known platform stack:** Clerk (authentication), Convex (backend/DB), Stripe (payments). Use **Next.js (App Router)** + **TypeScript** + **Tailwind CSS**. Host on **Vercel** or equivalent.

---

## Goals & Success Metrics

- Launch a working MVP in X weeks with the following measurable targets:
  - Conversion rate target (baseline): 1–3% (adjust after analytics)
  - Time-to-checkout (from landing): < 60s for returning users
  - Mobile Lighthouse score >= 70 (goal 85+ over time)
  - Orders processed correctly and visible in admin dashboard

---

## Scope — MVP (In)

**Customer-facing:**

- Homepage with hero, promotions block, and featured products.
- Product listing page with pagination and category filter.
- Product detail page (images, short description, price, stock status, add to cart).
- Search box with simple text search (client-side with Convex or server search).
- Persistent cart (localStorage + sync on login).
- Checkout flow using Stripe (Payment Intents). Support guest checkout and optional save-card for returning customers.
- Order confirmation page and transactional confirmation email.
- Contact / About / FAQ static pages.

**Admin:**

- Simple admin panel to create/edit/delete products, upload images, manage categories, view orders, and update order status.

**Platform & Infra:**

- Next.js + TypeScript, Tailwind CSS for rapid UI build.
- Clerk for authentication and user management.
- Convex for app backend and database (serverless functions + DB).
- Stripe for payments (sandbox for testing).
- CI pipeline: GitHub Actions (lint/build/test) and Vercel deployments.

---

## Scope — Deferred / Out of scope (for first implementation)

- Transbank / Webpay / Flow integration (defer; add later for improved local conversion)
- Advanced shipping integrations (carrier APIs, label printing)
- Subscriptions, loyalty programs, gift cards
- Multi-currency storefront or complex tax rules
- Full accounting / electronic invoice integration
- Complex promotions engine (basic coupons only)

---

## Non-functional requirements (best practices)

- **Performance:** mobile-first, optimized images (AVIF/WebP), CDN & edge caching (ISR/edge). Use static rendering where appropriate and incremental regeneration for product pages.
- **Security:** HTTPS everywhere, secure storage of secrets, strong JWT/session handling via Clerk, protect admin routes with role-based access, validate and verify Stripe webhooks.
- **Scalability:** Serverless functions for APIs and business logic; Convex for realtime DB needs. Design schemas and APIs for easy migration or replacement.
- **Accessibility:** Aim for WCAG AA basics (semantic HTML, keyboard focus, alt text on images, proper labels).
- **Observability:** Sentry for errors, GA4 for analytics, and basic server-side logging for order flows.

---

## Architecture overview

**Frontend:** Next.js App Router (TypeScript). Component library (atoms/molecules) using Tailwind.

**Auth:** Clerk controls authentication (signup/login, sessions, profile management). Keep user profile lightweight in Convex and reference Clerk user IDs.

**Backend / DB:** Convex functions + Convex DB for product, order, and minimal user metadata storage. Use Convex for business logic (reserve stock, create order objects, handle webhook events). Keep heavy logic small—Convex functions act as the API layer.

**Payments:** Stripe PaymentIntent flow. Client collects payment details using Stripe Elements or Stripe Checkout (decide based on UX tradeoffs). Use server-side endpoints to create PaymentIntents and to confirm and finalize orders after webhook confirmation.

**Storage / Media:** Store product images in an object storage accessible via CDN (Vercel/Cloudflare or S3 + CDN). Optimize images on upload (generate responsive sizes and AVIF/WebP).

**Deploy:** Vercel for frontend & serverless. Convex manages its own deploys. Use environment variables for keys (Clerk, Convex, Stripe). CI runs tests and lints on PRs.

---

## Data model (simplified — Convex friendly)

### Product

```json
{
  "id": "uuid",
  "sku": "string",
  "name": "string",
  "slug": "string",
  "description": "string",
  "price_cents": 0,
  "currency": "CLP",
  "stock": 0,
  "images": ["url"],
  "category": "string",
  "active": true
}
```

### Cart (client-first, persisted server-side on login)

```json
{
  "userId": "clerkId|null",
  "items": [{"productId": "id","sku":"string","qty":1,"unit_price_cents":0}],
  "updatedAt": "iso"
}
```

### Order

```json
{
  "id": "uuid",
  "userId": "clerkId|null",
  "items": [{"productId","qty","unit_price_cents"}],
  "subtotal_cents": 0,
  "shipping_cents": 0,
  "tax_cents": 0,
  "total_cents": 0,
  "status": "pending|paid|processing|shipped|delivered|cancelled",
  "payment": {"provider":"stripe","paymentIntentId":"pid","status":"succeeded|..."},
  "shippingAddress": {},
  "createdAt": "iso"
}
```

---

## API surface (suggested minimal endpoints)

- `GET /api/products?category=&q=&page=` — list products
- `GET /api/products/[slug]` — product detail
- `POST /api/cart` — server-side cart operations (optional; keep cart client-first)
- `POST /api/checkout/create-payment-intent` — create Stripe PaymentIntent and reserve stock
- `POST /api/webhooks/stripe` — handle Stripe webhooks and finalize orders
- `GET /api/orders/[id]` — order status (protected or token link)
- `POST /api/admin/products/import` — CSV import (admin only)

**Security notes:** Admin endpoints protected using Clerk role checks. Webhooks validate Stripe signature.

---

## UX guidelines & flows (MVP)

- **Mobile-first**: design and test on mobile sizes first.
- **Search-first**: prominent search in header with autosuggest of products.
- **Single-page checkout**: compact form: contact info, shipping address, payment method, review.
- **Guest checkout** allowed to reduce friction; optionally offer creating account after purchase.
- **Cart persistence**: save cart to Convex if user logs in; otherwise localStorage.
- **Clear stock indicators**: show "in stock", "low stock" messages and block checkout if stock is 0.
- **Progressive disclosures**: show shipping cost early (estimate) and final before payment.

---

## Admin feature set (minimal)

- Product CRUD (images, stock, price)
- Order list & status update
- Simple report page: recent orders, daily sales
- CSV import / export for products and orders

---

## Testing & QA

- Unit tests for price / cart calculations.
- Integration tests for checkout (mock Stripe) and webhook flows.
- End-to-end tests (Playwright) covering: browse -> add to cart -> checkout -> order confirmation.
- Performance smoke tests (Lighthouse scripts) run on CI.

---

## Acceptance criteria (MVP ready)

1. A user can browse products, add items to cart, and complete a Stripe-powered checkout (sandbox).
2. Orders created in Convex match payment state confirmed by Stripe webhooks.
3. Admin can view orders and update statuses.
4. Site is responsive and accessible at a baseline level (no major accessibility blockers).
5. CI pipeline runs on PRs including lint/build/test and auto-deploys to staging.

---

## Roadmap (first 6 sprints, each 1 week — adjust to team velocity)

- **Sprint 0 (3 days):** Repo scaffold, TS/Next/Tailwind, Clerk + Convex + Stripe sandbox wired, basic CI.
- **Sprint 1:** Homepage, header/footer, product listing, category model.
- **Sprint 2:** Product detail page, image gallery, add-to-cart, cart UI.
- **Sprint 3:** Checkout (Stripe), PaymentIntent integration, cart persistence.
- **Sprint 4:** Admin: product CRUD, order list, order status updates.
- **Sprint 5:** QA, accessibility fixes, performance tuning, staging -> production deploy.

---

## Expandability notes (how we leave the architecture ready)

- Use feature flags and modular routes so advanced services (Transbank, shipping APIs, subscriptions) can be added as separate modules.
- Keep domain logic in Convex functions (or microservices) so moving to another backend is straightforward.
- Use Stripe webhooks for payment decoupling — additional providers can be added with new webhook handlers and a unified payment reconciliation layer.
- Product images stored in object storage with generated responsive sizes to support future marketplaces or partner integrations.

---

## Minimal compliance & legal checklist (first deploy)

- Privacy policy page (Spanish, Spanish-Chile mentions): purpose of data and retention.
- Terms and Conditions page (simple consumer-facing).
- Prices displayed including taxes (or clearly indicating tax policy).

---

## Deliverables for the team

1. `prd.md` (this document).
2. Repo scaffold with README describing env vars and local setup.
3. Figma prototype for mobile home, listing, product, checkout.
4. Seed CSV with 15–30 products for initial upload.
5. Staging deploy with Stripe sandbox and functioning checkout test.

---

If you want, I can now:

- Export this PRD as a GitHub-ready Markdown file and create a Trello/Notion JSON with tasks, or
- Generate a prioritized issue list (GitHub Issues format) trimmed for the MVP,
- Produce a one-page executive summary for stakeholders.

Which of these do you want next?

