import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "sonner";

import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '@/components/ConvexClientProvider'
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd'
import { WebSiteJsonLd } from '@/components/seo/WebSiteJsonLd'
import { HeroHeader } from './(landing)/header'
import { BottomNav } from '@/components/navigation/BottomNav'
import FooterSection from './(landing)/footer'
import { PerformanceMonitor } from '@/components/performance/web-vitals'
import CookieConsent from '@/components/CookieConsent'
import Script from 'next/script'


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://minimarket.aramac.dev"),
  title: {
    default: "Minimarket ARAMAC",
    template: "%s | Minimarket ARAMAC",
  },
  description: "Sitio oficial de Minimarket ARAMAC",
  keywords: [
    "minimarket",
    "aramac",
    "ventas",
    "inventario",
    "Chile",
  ],
  openGraph: {
    type: "website",
    title: "Minimarket ARAMAC",
    description: "Compra fácil y gestión clara para tu negocio local.",
    url: "/",
    siteName: "Minimarket ARAMAC",
    images: [{ url: "/hero-section-main-app-dark.png", width: 1200, height: 630 }],
    locale: "es_CL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minimarket ARAMAC",
    description: "Compra fácil y gestión clara para tu negocio local.",
    images: ["/hero-section-main-app-dark.png"],
  },
  icons: {
    icon: [
      { url: "/gfav.png", type: "image/png" },
    ],
    apple: [{ url: "/gfav.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overscroll-none`}
      >
        <a href="#main" className="skip-link">Saltar al contenido</a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <ClerkProvider>
              <ConvexClientProvider>
                {/* Performance monitoring */}
                <PerformanceMonitor />
                {/* Vercel Analytics (optional) */}
                <Script src="/va.js" strategy="lazyOnload" />
                {/* Register Service Worker for basic offline cache */}
                <Script id="sw-register" strategy="afterInteractive">{`
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').catch(function(err) {
                        console.warn('SW registration failed', err);
                      });
                    });
                  }
                `}</Script>
                
                <OrganizationJsonLd 
                  name="Minimarket ARAMAC" 
                  url={process.env.NEXT_PUBLIC_APP_URL || "https://minimarket.aramac.dev"} 
                  logoUrl="/favicon.svg"
                />
                <WebSiteJsonLd
                  name="Minimarket ARAMAC"
                  url={process.env.NEXT_PUBLIC_APP_URL || "https://minimarket.aramac.dev"}
                  searchUrlTemplate={`${process.env.NEXT_PUBLIC_APP_URL || "https://minimarket.aramac.dev"}/search?q={search_term_string}`}
                />
                <HeroHeader />
                <main id="main" className="relative z-10 pt-20 lg:pt-24 xl:pt-28 pb-20 lg:pb-0" style={{ isolation: 'isolate' }}>
                  {children}
                </main>
                {/* Render cookie consent before bottom nav to ensure it stays on top on mobile */}
                <CookieConsent />
                <BottomNav />
                <FooterSection />
                {/* Toast notifications */}
                <Toaster position="top-right" richColors />
              </ConvexClientProvider>
            </ClerkProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
