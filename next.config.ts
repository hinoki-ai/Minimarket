import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function (phase: string) {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;

  const config = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },

    // Performance optimizations
    compress: true,

    // Image optimization
    images: {
      formats: ["image/webp", "image/avif"],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
      dangerouslyAllowSVG: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'randomuser.me',
        },
      ],
    },

    experimental: {
      optimizePackageImports: [
        "lucide-react",
        "@radix-ui/react-icons",
        "date-fns",
        "recharts",
      ],
    },

    // Removed unsupported Turbopack top-level config

    // Headers for caching and security
    async headers() {
      // Build Content Security Policy
      const cspProd = [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        // Allow Next.js runtime and same-origin scripts. Avoid unsafe-eval in prod.
        "script-src 'self' 'strict-dynamic' 'nonce-__CSP_NONCE__' 'unsafe-inline'",
        // Images may include data URLs and blobs for placeholders
        "img-src 'self' data: blob: https://randomuser.me",
        // Styles allow inline for Tailwind and Next/font
        "style-src 'self' 'unsafe-inline'",
        // Fonts from self
        "font-src 'self'",
        // Connections for APIs and Next.js HMR/analytics (self)
        "connect-src 'self' https:",
        // Media/object blocked by default
        "object-src 'none'",
        "media-src 'self'",
        // Upgrade any http subrequests
        'upgrade-insecure-requests'
      ].join('; ');

      const cspDev = [
        "default-src 'self'",
        // Dev server needs eval for React Refresh
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "img-src 'self' data: blob: https://randomuser.me",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self'",
        "connect-src 'self' ws: http: https:",
        "object-src 'none'",
      ].join('; ');

      const commonSecurityHeaders = [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        // Mitigate reflected XSS in older browsers
        { key: 'X-XSS-Protection', value: '1; mode=block' },
      ];

      const strictTransportSecurity = {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      };

      return [
        {
          source: "/(.*)",
          headers: [
            // Security headers
            ...(commonSecurityHeaders as any),
            // HSTS only on HTTPS (typically production)
            ...(!isDevServer ? [strictTransportSecurity] : []),
            // Add CSP
            { key: 'Content-Security-Policy', value: !isDevServer ? cspProd : cspDev },
          ],
        },
        {
          source: "/images/(.*)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
        {
          source: "/_next/static/(.*)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
      ];
    },
  } as any;

  // Only include custom webpack config when not running the dev server with Turbopack
  if (!isDevServer) {
    config.webpack = (webpackConfig: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
      if (dev && !isServer) {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: "all",
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: "vendors",
                chunks: "all",
              },
              common: {
                name: "common",
                minChunks: 2,
                chunks: "all",
              },
            },
          },
        };
      }

      if (!dev) {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          usedExports: true,
          sideEffects: false,
        };
      }

      // Enable bundle analyzer if ANALYZE=true
      if (process.env.ANALYZE === 'true' && !isServer) {
        try {
          const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
          webpackConfig.plugins = webpackConfig.plugins || [];
          webpackConfig.plugins.push(new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false }));
        } catch (e) {
          // Analyzer not installed; skip silently
        }
      }

      return webpackConfig;
    };
  }

  return config;
}
