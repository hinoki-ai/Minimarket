# Minimarket ARAMAC

Sitio y panel web para Minimarket ARAMAC. Enfocado en simplicidad, rapidez y claridad para negocios locales en Chile.

## Características

- **Autenticación con Clerk**: registro e inicio de sesión seguros
- **Base de datos en tiempo real (Convex)**
- **Planes y cobros (Clerk Billing)**
- **Dashboard responsivo** con tablas y gráficos
- **Tema claro/oscuro** y diseño moderno (TailwindCSS v4)

## Tecnología

- Next.js 15, React 19, TypeScript
- TailwindCSS v4 y componentes accesibles
- Convex (funciones y datos en tiempo real)
- Clerk (auth) y Clerk Billing (suscripciones)

## Requisitos

- Node.js 18+
- Cuenta de Clerk y Convex

## Configuración rápida

1. Instalar dependencias

```bash
npm install
```

1. Variables de entorno (crear `.env.local`)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_FRONTEND_API_URL=

NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

1. Iniciar Convex (configura variables internas)

```bash
npx convex dev
```

1. Webhook de Clerk (en Clerk Dashboard)

- Endpoint: `/api/clerk-users-webhook`
- Agrega el secreto a Convex como `CLERK_WEBHOOK_SECRET`

## Desarrollo

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Despliegue

Despliegue en Vercel y CI/CD en GitHub Actions:

- Configura en GitHub Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SITE_URL`.
- Flujos:
  - `.github/workflows/ci.yml`: lint + build en PRs y pushes a `main`.
  - `.github/workflows/vercel-deploy.yml`: despliegue automático a Vercel en pushes a `main`.
  - `.github/workflows/monitor.yml`: Lighthouse (LHCI) y verificación de uptime cada 30 minutos.

## Estructura

```text
app/                # Páginas y UI
components/         # Componentes reutilizables
convex/             # Funciones/Schema/HTTP de Convex
lib/                # Utilidades
middleware.ts       # Protección de rutas
```

## Licencia

© Minimarket ARAMAC. Todos los derechos reservados.
