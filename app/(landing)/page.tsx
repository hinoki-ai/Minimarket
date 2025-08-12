"use client";

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

export default function Home() {
  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
  const addToCart = useMutation(api.carts.addToCart);
  const categories = useQuery(api.categories.getCategoriesWithProductCount, {});
  const featuredProducts = useQuery(api.products.getFeaturedProducts, { limit: 8 });
  const freshProducts = useQuery(api.products.getFreshProducts, { limit: 6 });
  const cart = useQuery(api.carts.getUserCart, (userId || sessionId) ? { userId: userId ?? undefined, sessionId: userId ? undefined : sessionId } : undefined);

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

  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  return (
    <div>
      <MinimartHero />
      {/* Quick category nav under header */}
      <div className="sticky top-16 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="mx-auto max-w-7xl px-6 py-2">
          {hasData.categories && (
            <CategoryNav categories={categories as any} />
          )}
          {/* Fulfillment toggle + Free shipping progress */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md border p-1">
                <Button
                  variant={fulfillment === 'delivery' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8"
                  onClick={() => setFulfillment('delivery')}
                >
                  Entrega
                </Button>
                <Button
                  variant={fulfillment === 'pickup' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8"
                  onClick={() => setFulfillment('pickup')}
                >
                  Retiro en tienda
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                {fulfillment === 'delivery' ? 'Hoy 30–45 min' : 'Listo en 10–15 min'}
              </span>
            </div>
            <div className="md:col-span-2">
              {cart && (
                <div className="rounded-md border p-2">
                  {Math.max(0, 20000 - (cart?.subtotal ?? 0)) === 0 ? (
                    <p className="text-xs font-medium">¡Envío gratis aplicado!</p>
                  ) : (
                    <p className="text-xs">Te faltan <span className="font-semibold">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(Math.max(0, 20000 - (cart?.subtotal ?? 0)))}</span> para envío gratis</p>
                  )}
                  <div className="mt-2 h-1 w-full rounded-full bg-muted">
                    <div className="h-1 rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round(((cart?.subtotal ?? 0) / 20000) * 100))}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <section id="categorias" className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          {/* Campaigns / Coupons band */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bento-card">
              <p className="text-sm font-medium">Tiempo limitado</p>
              <p className="text-2xl font-bold">10% OFF en frescos</p>
              <p className="text-muted-foreground text-sm">Usa código FRESCOS10</p>
            </div>
            <div className="bento-card">
              <p className="text-sm font-medium">Cupón semanal</p>
              <p className="text-2xl font-bold">2x1 Snacks</p>
              <p className="text-muted-foreground text-sm">Hasta domingo</p>
            </div>
            <div className="bento-card">
              <p className="text-sm font-medium">Entrega</p>
              <p className="text-2xl font-bold">Hoy 30–45 min</p>
              <p className="text-muted-foreground text-sm">Retiro en tienda disponible</p>
            </div>
          </div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-semibold">Categorías</h2>
          </div>
          {hasData.categories ? (
            <CategoryGrid categories={categories as any} layout="bento" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 rounded-lg border bg-muted animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="py-12 md:py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-6">
          {hasData.featured && (
            <ItemListJsonLd
              itemListName="Productos destacados"
              items={(featuredProducts as any[]).map((p: any) => ({
                url: `https://minimarket-aramac.local/products/${p.slug}`,
                name: p.name,
                image: p.images?.[0]?.url,
              }))}
            />
          )}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-semibold">Productos destacados</h2>
          </div>
          {hasData.featured ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(featuredProducts as any[]).map((p) => (
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 rounded-lg border bg-card animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Frescos y nuevos */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          {hasData.fresh && (
            <ItemListJsonLd
              itemListName="Recién llegados y frescos"
              items={(freshProducts as any[]).map((p: any) => ({
                url: `https://minimarket-aramac.local/products/${p.slug}`,
                name: p.name,
                image: p.images?.[0]?.url,
              }))}
            />
          )}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-semibold">Recién llegados y frescos</h2>
          </div>
          {hasData.fresh ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {(freshProducts as any[]).map((p) => (
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-lg border bg-card animate-pulse" />
              ))}
            </div>
          )}
        </div>
      </section>

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
