'use client';

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Product, Category, Cart } from "@/types/convex";

import { MinimartHero } from "@/components/ui/minimarket-hero";
import { CategoryGrid, CategoryNav } from "@/components/ui/category-grid";
import { ProductCard } from "@/components/ui/product-card";
import { useAuth } from "@clerk/nextjs";
import { useGuestSessionId } from "@/hooks/use-guest-session";
import { ItemListJsonLd } from "@/components/seo/ItemListJsonLd";
import { MiniCartSheet } from "@/components/ui/mini-cart";
import { Button } from "@/components/ui/button";
import Testimonials from "./testimonials";
import { CometCard } from "@/components/ui/comet-card";
import ServiceHighlights from "@/components/ui/service-highlights";
import Image from "next/image";

export default function HomeClient() {
  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
  const addToCart = useMutation(api.carts.addToCart);
  const categories = useQuery(api.categories.getCategoriesWithProductCount, {}) as (Category & { productCount: number })[] | undefined;
  const featuredProducts = useQuery(api.products.getFeaturedProducts, { limit: 8 }) as Product[] | undefined;
  const freshProducts = useQuery(api.products.getFreshProducts, { limit: 6 }) as Product[] | undefined;
  const cart = useQuery(
    api.carts.getUserCart, 
    (userId || sessionId) ? { 
      userId: userId ?? undefined, 
      sessionId: userId ? undefined : sessionId 
    } : "skip"
  ) as Cart | undefined;

  // Delivery / Pickup toggle (persist to localStorage) - hydration-safe
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    // Mark as hydrated and load from localStorage
    setIsHydrated(true);
    const saved = localStorage.getItem('minimarket-fulfillment');
    if (saved === 'delivery' || saved === 'pickup') setFulfillment(saved);
  }, []);
  
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('minimarket-fulfillment', fulfillment);
    }
  }, [fulfillment, isHydrated]);

  const hasData = useMemo(() => ({
    categories: Array.isArray(categories) && categories.length > 0,
    featured: Array.isArray(featuredProducts) && featuredProducts.length > 0,
    fresh: Array.isArray(freshProducts) && freshProducts.length > 0,
  }), [categories, featuredProducts, freshProducts]);

  // Build categoryId -> slug map to compute image fallbacks
  const categoryIdToSlug = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(categories)) {
      for (const c of categories) {
        if (c?._id && c?.slug) map.set(String(c._id), String(c.slug));
      }
    }
    return map;
  }, [categories]);

  // Default square images per category slug (using Chilean categories)
  const getDefaultImageForCategory = (slug?: string) => {
    switch (slug) {
      case 'bebidas':
        return '/images/products/bebidas/coca-cola-15l.svg';
      case 'snacks':
        return '/images/products/snacks/papas-lays-original.svg';
      case 'panaderia':
        return '/images/products/panaderia/pan-hallulla-4u.svg';
      case 'lacteos':
        return '/images/products/lacteos/leche-soprole-entera-1l.svg';
      case 'carnes':
        return '/images/products/carnes/jamon-cocido-san-jorge.svg';
      case 'aseo':
        return '/images/products/aseo/detergente-ariel-polvo-1kg.svg';
      case 'hogar':
        return '/images/products/hogar/pilas-energizer-aa.svg';
      // Legacy fallbacks for old categories
      case 'drinks':
        return '/images/products/bebidas/coca-cola-15l.svg';
      case 'fresh':
        return '/images/products/panaderia/pan-hallulla-4u.svg';
      case 'bakery':
        return '/images/products/panaderia/pan-hallulla-4u.svg';
      case 'dairy':
        return '/images/products/lacteos/leche-soprole-entera-1l.svg';
      case 'meat':
        return '/images/products/carnes/jamon-cocido-san-jorge.svg';
      case 'frozen':
        return '/images/products/bebidas/coca-cola-15l.svg';
      case 'household':
        return '/images/products/hogar/pilas-energizer-aa.svg';
      case 'personal-care':
        return '/images/products/aseo/detergente-ariel-polvo-1kg.svg';
      case 'electronics':
        return '/images/products/hogar/pilas-energizer-aa.svg';
      case 'toys':
        return '/images/products/snacks/papas-lays-original.svg';
      case 'stationery':
        return '/images/products/hogar/pilas-energizer-aa.svg';
      default:
        return '/images/products/bebidas/coca-cola-15l.svg';
    }
  };

  // Ensure products have at least one image; inject category-based fallback
  const withFallbackImages = useMemo(() => {
    const ensure = (p: Product): Product => {
      if (p?.images && Array.isArray(p.images) && p.images.length > 0 && p.images[0]?.url) return p;
      const slug = categoryIdToSlug.get(String(p?.categoryId));
      const url = getDefaultImageForCategory(slug);
      return {
        ...p,
        images: [
          {
            url,
            alt: p?.name || 'Producto',
            sortOrder: 0,
          },
        ],
      };
    };
    return {
      featured: Array.isArray(featuredProducts) ? featuredProducts.map(ensure) : [],
      fresh: Array.isArray(freshProducts) ? freshProducts.map(ensure) : [],
    };
  }, [featuredProducts, freshProducts, categoryIdToSlug]);

  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [liderImages, setLiderImages] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadLiderImages() {
      try {
        const res = await fetch('/images/products/lider/lider-files.json', { cache: 'force-cache' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setLiderImages(data.slice(0, 20));
      } catch (_) {
        // ignore
      }
    }
    loadLiderImages();
    return () => { cancelled = true; };
  }, []);
  return (
    <div>
      <MinimartHero />

      {/* Recién llegados y frescos - First product display below hero */}
      <section className="py-12 md:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-7xl px-6 xl:px-8">
          {hasData.fresh && (
            <ItemListJsonLd
              itemListName="Recién llegados y frescos"
              items={withFallbackImages.fresh.map((p) => ({
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://minimarket.aramac.dev'}/products/${p.slug}`,
                name: p.name,
                image: p.images?.[0]?.url,
              }))}
            />
          )}
          <div className="mb-8 lg:mb-12 xl:mb-16 flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold">Recién llegados y frescos</h2>
          </div>
          {hasData.fresh ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6 xl:gap-8">
              {withFallbackImages.fresh.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  onAddToCart={async (productId, quantity) => {
                    await addToCart({ productId, quantity, userId: userId ?? undefined, sessionId: userId ? undefined : sessionId });
                    setIsMiniCartOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6 xl:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 lg:h-72 rounded-lg border bg-card animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="py-12 md:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-7xl px-6 xl:px-8">
          {hasData.featured && (
            <ItemListJsonLd
              itemListName="Productos destacados"
              items={withFallbackImages.featured.map((p) => ({
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://minimarket.aramac.dev'}/products/${p.slug}`,
                name: p.name,
                image: p.images?.[0]?.url,
              }))}
            />
          )}
          <div className="mb-8 lg:mb-12 xl:mb-16 flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold">Productos destacados</h2>
          </div>
          {hasData.featured ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6 xl:gap-8">
              {withFallbackImages.featured.map((p, idx) => (
                <CometCard key={p._id} className="group">
                  <ProductCard 
                    product={p}
                    index={idx}
                    onAddToCart={async (productId, quantity) => {
                      await addToCart({ productId, quantity, userId: userId ?? undefined, sessionId: userId ? undefined : sessionId });
                      setIsMiniCartOpen(true);
                    }}
                  />
                </CometCard>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6 xl:gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 lg:h-72 rounded-lg border bg-card animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Imágenes de supermercados (Lider) */}
      {liderImages.length > 0 && (
        <section className="py-12 md:py-16 lg:py-20 xl:py-24">
          <div className="mx-auto max-w-7xl px-6 xl:px-8">
            <div className="mb-8 lg:mb-12 xl:mb-16 flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold">Imágenes de supermercados</h2>
              <span className="text-sm text-muted-foreground">Fuente: Lider</span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 lg:gap-6 xl:gap-8">
              {liderImages.map((src) => (
                <div key={src} className="relative aspect-square rounded-md border overflow-hidden bg-muted">
                  <Image
                    src={src}
                    alt="Lider product image"
                    fill
                    sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 12vw"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Quick category nav under header */}
      <div className="sticky top-16 z-30 bg-transparent border-b" style={{ isolation: 'isolate' }}>
        <div className="mx-auto max-w-7xl px-6 xl:px-8 py-2 xl:py-3">
          {hasData.categories && categories && (
            <CategoryNav categories={categories} />
          )}
          {/* Fulfillment toggle + Free shipping progress */}
          <div className="mt-3 lg:mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-3 lg:gap-6">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="inline-flex rounded-md border p-1">
                <Button
                  variant={fulfillment === 'delivery' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 lg:h-10 lg:px-4"
                  onClick={() => setFulfillment('delivery')}
                >
                  Entrega
                </Button>
                <Button
                  variant={fulfillment === 'pickup' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 lg:h-10 lg:px-4"
                  onClick={() => setFulfillment('pickup')}
                >
                  Retiro en tienda
                </Button>
              </div>
              <span className="text-sm lg:text-base text-muted-foreground">
                {fulfillment === 'delivery' ? 'Hoy 30–45 min' : 'Listo en 10–15 min'}
              </span>
            </div>
            <div className="md:col-span-2">
              {cart && (
                <div className="rounded-md border p-2 lg:p-4">
                  {Math.max(0, 20000 - (cart?.subtotal ?? 0)) === 0 ? (
                    <p className="text-xs lg:text-sm font-medium">¡Envío gratis aplicado!</p>
                  ) : (
                    <p className="text-xs lg:text-sm">Te faltan <span className="font-semibold">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(Math.max(0, 20000 - (cart?.subtotal ?? 0)))}</span> para envío gratis</p>
                  )}
                  <div className="mt-2 h-1 lg:h-2 w-full rounded-full bg-muted">
                    <div className="h-1 lg:h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round(((cart?.subtotal ?? 0) / 20000) * 100))}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <section id="categorias" className="py-12 md:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-7xl px-6 xl:px-8">
          {/* Campaigns / Coupons band */}
          <section id="promociones" className="mb-8 lg:mb-12 xl:mb-16 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
            <div className="bento-card lg:p-6 xl:p-8">
              <p className="text-sm lg:text-base font-medium">Tiempo limitado</p>
              <p className="text-2xl lg:text-3xl xl:text-4xl font-bold">10% OFF en frescos</p>
              <p className="text-muted-foreground text-sm lg:text-base xl:text-lg">Usa código FRESCOS10</p>
            </div>
            <div className="bento-card lg:p-6 xl:p-8">
              <p className="text-sm lg:text-base font-medium">Cupón semanal</p>
              <p className="text-2xl lg:text-3xl xl:text-4xl font-bold">2x1 Snacks</p>
              <p className="text-muted-foreground text-sm lg:text-base xl:text-lg">Hasta domingo</p>
            </div>
            <div className="bento-card lg:p-6 xl:p-8">
              <p className="text-sm lg:text-base font-medium">Entrega</p>
              <p className="text-2xl lg:text-3xl xl:text-4xl font-bold">Hoy 30–45 min</p>
              <p className="text-muted-foreground text-sm lg:text-base xl:text-lg">Retiro en tienda disponible</p>
            </div>
          </section>
          <div className="mb-8 lg:mb-12 xl:mb-16 flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold">Categorías</h2>
          </div>
          {hasData.categories && categories ? (
            <CategoryGrid categories={categories} layout="bento" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 lg:h-36 rounded-lg border bg-muted animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </section>



      {/* Service highlights just above footer */}
      <ServiceHighlights />

      {/* Testimonios */}
      <Testimonials />
      <MiniCartSheet 
        open={isMiniCartOpen} 
        onOpenChange={setIsMiniCartOpen}
        userId={userId}
        sessionId={userId ? null : sessionId}
      />
    </div>
  );
}

