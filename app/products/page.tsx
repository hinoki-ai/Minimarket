'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ProductCard } from '@/components/ui/product-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@clerk/nextjs';
import { useGuestSessionId } from '@/hooks/use-guest-session';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { ItemListJsonLd } from '@/components/seo/ItemListJsonLd';

export default function ProductsPage() {
  const [sortBy, setSortBy] = useState<'newest' | 'price' | 'name' | 'popularity'>('newest');
  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
  const addToCart = useMutation(api.carts.addToCart);

  const products = useQuery(api.products.getProducts, { limit: 24, sortBy });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', url: 'https://minimarket-aramac.local/' },
          { name: 'Productos', url: 'https://minimarket-aramac.local/products' },
        ]}
      />
      {Array.isArray(products) && products.length > 0 && (
        <ItemListJsonLd
          itemListName={`Catálogo (${sortBy})`}
          items={(products as any[]).map((p: any) => ({
            url: `https://minimarket-aramac.local/products/${p.slug}`,
            name: p.name,
            image: p.images?.[0]?.url,
          }))}
        />
      )}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">Catálogo</h1>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más nuevos</SelectItem>
              <SelectItem value="popularity">Populares</SelectItem>
              <SelectItem value="price">Precio</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(products ?? []).map((p: any) => (
          <ProductCard 
            key={p._id} 
            product={p}
            onAddToCart={async (productId, quantity) => {
              await addToCart({ productId, quantity, userId: userId ?? undefined, sessionId: userId ? undefined : sessionId });
            }}
          />
        ))}
      </div>
    </div>
  );
}

