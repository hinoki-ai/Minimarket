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
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "X-Frame-Options",
              value: "DENY",
            },
            {
              key: "X-Content-Type-Options",
              value: "nosniff",
            },
            {
              key: "Referrer-Policy",
              value: "origin-when-cross-origin",
            },
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

      return webpackConfig;
    };
  }

  return config;
}
