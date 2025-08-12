'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ProductCard } from '@/components/ui/product-card';
import { useAuth } from '@clerk/nextjs';
import { useGuestSessionId } from '@/hooks/use-guest-session';
import { SearchBar } from '@/components/ui/search-bar';
import { ItemListJsonLd } from '@/components/seo/ItemListJsonLd';

export default function SearchPage() {
  const sp = useSearchParams();
  const q = sp.get('q') || '';
  const productsApi: any = (api as any).products;
  const results = useQuery(productsApi?.searchProducts, q ? { searchTerm: q, limit: 24 } : undefined) as any[] | undefined;

  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
  const cartsApi: any = (api as any).carts;
  const addToCart = useMutation(cartsApi?.addToCart);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      <div className="max-w-2xl">
        <SearchBar placeholder="Buscar productos..." />
      </div>
      {Array.isArray(results) && results.length > 0 && (
        <ItemListJsonLd
          itemListName={`Resultados para ${q}`}
          items={(results as any[]).map((p: any) => ({
            url: `https://minimarket-aramac.local/products/${p.slug}`,
            name: p.name,
            image: p.images?.[0]?.url,
          }))}
        />
      )}
      <h1 className="text-xl font-medium">Resultados para "{q}"</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(results ?? []).map((p: any) => (
          <ProductCard key={p._id} product={p} onAddToCart={async (productId, quantity) => {
            await addToCart({ productId, quantity, userId: userId ?? undefined, sessionId: userId ? undefined : sessionId });
          }} />
        ))}
      </div>
    </div>
  );
}

