'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ProductCard } from '@/components/ui/product-card';
import { CategoryGridSkeleton } from '@/components/performance/lazy-components';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@clerk/nextjs';
import { useGuestSessionId } from '@/hooks/use-guest-session';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { ItemListJsonLd } from '@/components/seo/ItemListJsonLd';

export default function ProductsPageClient() {
  const [sortBy, setSortBy] = useState<'newest' | 'price' | 'name' | 'popularity'>('newest');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
const cartsApi: any = (api as any).carts;
const addToCart = useMutation(cartsApi?.addToCart);

const productsApi: any = (api as any).products;
const products = useQuery(productsApi?.getProducts, { limit: 24, sortBy, minPrice, maxPrice, tags: selectedTags });

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
          itemListName="Productos"
          items={(products as any[]).map((p: any) => ({
            url: `https://minimarket-aramac.local/products/${p.slug}`,
            name: p.name,
            image: p.images?.[0]?.url,
          }))}
        />
      )}
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Catálogo</h1>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'newest' | 'price' | 'name' | 'popularity')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Más nuevos</SelectItem>
            <SelectItem value="popularity">Más populares</SelectItem>
            <SelectItem value="price">Precio: menor a mayor</SelectItem>
            <SelectItem value="name">Nombre A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="min-price">Mínimo</label>
          <input
            id="min-price"
            type="number"
            className="h-9 w-full rounded-md border px-3 py-1 text-sm"
            placeholder="$0"
            value={minPrice ?? ''}
            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
            min={0}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="max-price">Máximo</label>
          <input
            id="max-price"
            type="number"
            className="h-9 w-full rounded-md border px-3 py-1 text-sm"
            placeholder="$50.000"
            value={maxPrice ?? ''}
            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
            min={0}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="tags">Etiquetas</label>
          <input
            id="tags"
            type="text"
            className="h-9 w-full rounded-md border px-3 py-1 text-sm"
            placeholder="comida,bebida"
            value={selectedTags.join(',')}
            onChange={(e) => setSelectedTags(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          />
        </div>
      </div>

      {Array.isArray(products) && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product: any, index: number) => (
            <ProductCard 
              key={product._id} 
              product={product}
              priority={index < 8} // First 8 products above fold
              index={index}
              onAddToCart={async (productId, quantity) => {
                await addToCart({ 
                  productId, 
                  quantity, 
                  userId: userId ?? undefined, 
                  sessionId: userId ? undefined : sessionId 
                });
              }}
            />
          ))}
        </div>
      ) : products === undefined ? (
        <CategoryGridSkeleton />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay productos disponibles en este momento.</p>
        </div>
      )}
    </div>
  );
}