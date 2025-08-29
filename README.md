# Minimarket

A Next.js e-commerce application for Chilean minimarket products with Convex backend.

## Project Structure

- `src/` - Source code
  - `app/` - Next.js app directory (pages and API routes)
  - `components/` - Reusable React components
  - `convex/` - Convex backend functions and schema
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions and libraries
  - `types/` - TypeScript type definitions
- `public/` - Static assets served by Next.js
- `data/` - Product data and scraped content
- `config/` - Configuration files (package.json, next.config.ts, etc.)
- `docs/` - Documentation and deployment guides
- `scripts/` - Testing and utility scripts
- `assets/` - Additional assets and scraped content
- `tests/` - Test files and configurations

## Development

### Prerequisites

- Node.js 18+
- pnpm or npm
- Convex account

### Installation

```bash
pnpm install
```

### Development Server

```bash
pnpm dev
```

### Database Setup

```bash
npx convex dev
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/README-DEPLOYMENT.md](docs/README-DEPLOYMENT.md) for detailed deployment instructions.

## Configuration

All configuration files are in the `config/` directory. Environment variables should be set in `.env.local`.