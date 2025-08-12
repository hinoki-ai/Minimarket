import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '@/components/ConvexClientProvider'
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd'
import { WebSiteJsonLd } from '@/components/seo/WebSiteJsonLd'
import { HeroHeader } from './(landing)/header'
import FooterSection from './(landing)/footer'
import { PerformanceMonitor } from '@/components/performance/web-vitals'
import CookieConsent from '@/components/CookieConsent'


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://minimarket-aramac.local"),
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
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

export const viewport: Viewport = {
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>
            <ConvexClientProvider>
              {/* Performance monitoring */}
              <PerformanceMonitor />
              
              <OrganizationJsonLd 
                name="Minimarket ARAMAC" 
                url="https://minimarket-aramac.local" 
                logoUrl="/favicon.svg"
              />
              <WebSiteJsonLd
                name="Minimarket ARAMAC"
                url="https://minimarket-aramac.local"
                searchUrlTemplate="https://minimarket-aramac.local/search?q={search_term_string}"
              />
              <HeroHeader />
              <main className="pt-20 pb-20 lg:pb-0">
                {children}
              </main>
              <CookieConsent />
              <FooterSection />
            </ConvexClientProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
