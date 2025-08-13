'use client';

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

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

export default function HomeClient() {
  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
  const cartsApi: any = (api as any).carts;
  const addToCart = useMutation(cartsApi?.addToCart);
  const categoriesApi: any = (api as any).categories;
  const productsApi: any = (api as any).products;
  const categories = useQuery(categoriesApi?.getCategoriesWithProductCount, {});
  const featuredProducts = useQuery(productsApi?.getFeaturedProducts, { limit: 8 });
  const freshProducts = useQuery(productsApi?.getFreshProducts, { limit: 6 });
  const cart = useQuery(cartsApi?.getUserCart, (userId || sessionId) && cartsApi?.getUserCart ? { userId: userId ?? undefined, sessionId: userId ? undefined : sessionId } : undefined);

  // Delivery / Pickup toggle (persist to localStorage)
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('minimarket-fulfillment') : null;
    if (saved === 'delivery' || saved === 'pickup') setFulfillment(saved);
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('minimarket-fulfillment', fulfillment);
  }, [fulfillment]);

  const hasData = useMemo(() => ({
    categories: Array.isArray(categories) && categories.length > 0,
    featured: Array.isArray(featuredProducts) && featuredProducts.length > 0,
    fresh: Array.isArray(freshProducts) && freshProducts.length > 0,
  }), [categories, featuredProducts, freshProducts]);

  // Build categoryId -> slug map to compute image fallbacks
  const categoryIdToSlug = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(categories)) {
      for (const c of categories as any[]) {
        if (c?._id && c?.slug) map.set(String(c._id), String(c.slug));
      }
    }
    return map;
  }, [categories]);

  // Default square images per category slug (under public/images/products)
  const getDefaultImageForCategory = (slug?: string) => {
    switch (slug) {
      case 'drinks':
        return '/images/products/drinks/generic-bottle.webp';
      case 'snacks':
        return '/images/products/snacks/generic-chips.webp';
      case 'fresh':
        return '/images/products/fresh/generic-fruits.webp';
      case 'bakery':
        return '/images/products/bakery/generic-bread.webp';
      case 'dairy':
        return '/images/products/dairy/generic-milk.webp';
      case 'meat':
        return '/images/products/meat/generic-meat.webp';
      case 'frozen':
        return '/images/products/frozen/ice-cream-tub.webp';
      case 'household':
        return '/images/products/household/generic-spray.webp';
      case 'personal-care':
        return '/images/products/personal-care/generic-shampoo.webp';
      case 'electronics':
        return '/images/products/electronics/generic-headphones.webp';
      case 'toys':
        return '/images/products/toys/generic-toy.webp';
      case 'stationery':
        return '/images/products/stationery/pens-set.webp';
      default:
        return '/images/products/fresh/generic-fruits.webp';
    }
  };

  // Ensure products have at least one image; inject category-based fallback
  const withFallbackImages = useMemo(() => {
    const ensure = (p: any) => {
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
      featured: Array.isArray(featuredProducts) ? (featuredProducts as any[]).map(ensure) : [],
      fresh: Array.isArray(freshProducts) ? (freshProducts as any[]).map(ensure) : [],
    };
  }, [featuredProducts, freshProducts, categoryIdToSlug]);

  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  return (
    <div>
      <MinimartHero />
      {/* Productos Destacados (moved just below hero) */}
      <section className="py-12 md:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-7xl px-6 xl:px-8">
          {hasData.featured && (
            <ItemListJsonLd
              itemListName="Productos destacados"
              items={(withFallbackImages.featured as any[]).map((p: any) => ({
                url: `https://minimarket-aramac.local/products/${p.slug}`,
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
              {(withFallbackImages.featured as any[]).map((p, idx) => (
                <CometCard key={p._id} className="group">
                  <ProductCard 
                    product={p as any}
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
      {/* Quick category nav under header */}
      <div className="sticky top-16 z-10 bg-transparent border-b">
        <div className="mx-auto max-w-7xl px-6 xl:px-8 py-2 xl:py-3">
          {hasData.categories && (
            <CategoryNav categories={categories as any} />
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
          {hasData.categories ? (
            <CategoryGrid categories={categories as any} layout="bento" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 lg:h-36 rounded-lg border bg-muted animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </section>

      

      {/* Frescos y nuevos */}
      <section className="py-12 md:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-7xl px-6 xl:px-8">
          {hasData.fresh && (
            <ItemListJsonLd
              itemListName="Recién llegados y frescos"
              items={(withFallbackImages.fresh as any[]).map((p: any) => ({
                url: `https://minimarket-aramac.local/products/${p.slug}`,
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
              {(withFallbackImages.fresh as any[]).map((p) => (
                <ProductCard 
                  key={p._id} 
                  product={p as any}
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

