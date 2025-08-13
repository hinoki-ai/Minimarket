'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ui/product-card';
import { useGuestSessionId } from '@/hooks/use-guest-session';
import { ProductJsonLd } from '@/components/seo/ProductJsonLd';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { CategoryBreadcrumb } from '@/components/ui/category-grid';
import { CheckCircle, AlertCircle, X, Heart, Star } from 'lucide-react';

const formatCLP = (price: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

export default function ProductDetailClient() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string);
  const productsApi: any = (api as any).products;
  const categoriesApi: any = (api as any).categories;
  const product = useQuery(productsApi?.getProductBySlug, slug ? { slug } : undefined);
  const recommendations = useQuery(productsApi?.getRecommendedProducts, product ? { productId: (product as any)._id, limit: 4 } : undefined);
  const breadcrumb = useQuery(
    categoriesApi?.getCategoryBreadcrumb,
    product ? { categoryId: (product as any).categoryId } : undefined
  ) as any[] | undefined;

  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
  const cartsApi: any = (api as any).carts;
  const addToCart = useMutation(cartsApi?.addToCart);
  const reviewsApi: any = (api as any).reviews;
  const wishlistsApi: any = (api as any).wishlists;
  const reviews = useQuery(reviewsApi?.listReviews, product ? { productId: (product as any)._id, limit: 10 } : undefined) as any[] | undefined;
  const toggleWishlist = useMutation(wishlistsApi?.toggleWishlist);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-muted-foreground">Cargando producto...</p>
      </div>
    );
  }

  const p: any = product;
  const images: Array<{ url: string; alt?: string }> = p.images?.length ? p.images : [{ url: '/placeholder-product.jpg', alt: p.name }];
  const mainImage = images[Math.min(selectedImageIndex, images.length - 1)];

  const getStockStatus = (inventory: any): 'in-stock' | 'low-stock' | 'out-of-stock' => {
    if (!inventory?.trackInventory) return 'in-stock';
    if (inventory.quantity === 0) return 'out-of-stock';
    if (inventory.quantity <= inventory.lowStockThreshold) return 'low-stock';
    return 'in-stock';
  };

  const stockStatus = getStockStatus(p.inventory);
  const StockIndicator = () => {
    const config = {
      'in-stock': { icon: CheckCircle, text: 'En stock', className: 'text-green-600 dark:text-green-500' },
      'low-stock': { icon: AlertCircle, text: `Solo ${p.inventory?.quantity}`, className: 'text-amber-600 dark:text-amber-500' },
      'out-of-stock': { icon: AlertCircle, text: 'Agotado', className: 'text-destructive' },
    } as const;
    const c = config[stockStatus];
    const Icon = c.icon;
    return (
      <div className={`flex items-center gap-2 ${c.className}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{c.text}</span>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-12">
      <ProductJsonLd
        name={p.name}
        description={p.shortDescription || p.description}
        sku={p.sku}
        price={p.price}
        images={images.map((i) => i.url)}
        availability={(p.inventory?.trackInventory && p.inventory?.quantity === 0) ? 'OutOfStock' : 'InStock'}
        url={`https://minimarket-aramac.local/products/${p.slug}`}
      />
      {Array.isArray(breadcrumb) && (
        <BreadcrumbJsonLd
          items={[
            { name: 'Inicio', url: 'https://minimarket-aramac.local/' },
            { name: 'Categorías', url: 'https://minimarket-aramac.local/products' },
            ...breadcrumb.map((c: any) => ({ name: c.name, url: `https://minimarket-aramac.local/categories/${c.slug}` })),
            { name: p.name, url: `https://minimarket-aramac.local/products/${p.slug}` },
          ]}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden border">
            <Image
              src={mainImage.url}
              alt={mainImage.alt || p.name}
              fill
              className="object-cover cursor-zoom-in"
              onClick={() => setIsZoomOpen(true)}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, idx) => (
                <button
                  key={`${img.url}-${idx}`}
                  className={`relative aspect-square rounded-md overflow-hidden border ${idx === selectedImageIndex ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedImageIndex(idx)}
                  aria-label={`Ver imagen ${idx + 1}`}
                >
                  <Image src={img.url} alt={img.alt || p.name} fill sizes="(max-width: 768px) 20vw, 10vw" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-semibold">{p.name}</h1>
          <div className="text-xl font-bold">{formatCLP(p.price)}</div>
          <StockIndicator />
          {p.shortDescription && (
            <p className="text-muted-foreground">{p.shortDescription}</p>
          )}
          <div className="flex gap-2">
            <Button
              className="w-full md:w-auto"
              onClick={async () => {
                await addToCart({ productId: p._id, quantity: 1, userId: userId ?? undefined, sessionId: userId ? undefined : sessionId });
              }}
            >
              Agregar al carrito
            </Button>
            {userId && (
              <Button
                variant="outline"
                onClick={async () => {
                  await toggleWishlist({ userId, productId: p._id });
                }}
                aria-label="Agregar a favoritos"
              >
                <Heart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {Array.isArray(breadcrumb) && breadcrumb.length > 0 && (
        <CategoryBreadcrumb categories={breadcrumb as any} />
      )}

      {Array.isArray(recommendations) && recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold">También te puede interesar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.map((rp: any) => (
              <ProductCard key={rp._id} product={rp} onAddToCart={async (productId, quantity) => {
                await addToCart({ productId, quantity, userId: userId ?? undefined, sessionId: userId ? undefined : sessionId });
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="space-y-3">
        <h2 className="text-xl md:text-2xl font-semibold">Opiniones</h2>
        {reviews === undefined ? (
          <p className="text-muted-foreground">Cargando opiniones…</p>
        ) : Array.isArray(reviews) && reviews.length > 0 ? (
          <ul className="space-y-3">
            {reviews.map((r: any) => (
              <li key={r._id} className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.customerName}</div>
                  <div className="flex items-center gap-1 text-amber-500" aria-label={`${r.rating} estrellas`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? '' : 'opacity-20'}`} />
                    ))}
                  </div>
                </div>
                {r.title && <div className="mt-1 font-semibold">{r.title}</div>}
                {r.content && <p className="text-sm text-muted-foreground mt-1">{r.content}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Aún no hay opiniones.</p>
        )}
      </div>

      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setIsZoomOpen(false)}>
          <button
            className="absolute top-4 right-4 text-white/90 hover:text-white"
            aria-label="Cerrar"
            onClick={() => setIsZoomOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
            <div className="relative w-full max-w-3xl aspect-square">
              <Image src={mainImage.url} alt={mainImage.alt || p.name} fill sizes="(max-width: 768px) 100vw, 768px" className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

