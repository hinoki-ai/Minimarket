'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ProductCard } from '@/components/ui/product-card';
import { useAuth } from '@clerk/nextjs';
import { useGuestSessionId } from '@/hooks/use-guest-session';
import { SearchBar } from '@/components/ui/search-bar';
import { ItemListJsonLd } from '@/components/seo/ItemListJsonLd';
import { useScreenReader } from '@/lib/accessibility';
import { CategoryGridSkeleton } from '@/components/performance/lazy-components';

function SearchContent() {
  const sp = useSearchParams();
  const q = sp.get('q') || '';
  const { announce } = useScreenReader();
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  
  const results = useQuery(
    api.products.searchProducts,
    q ? { searchTerm: q, limit: 24, minPrice, maxPrice, tags } : 'skip'
  ) as Array<{ _id: string; name: string; slug: string; images?: Array<{ url?: string }>; }> | undefined;

  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
  const addToCart = useMutation(api.carts.addToCart);
  
  // Announce search results to screen readers
  useEffect(() => {
    if (q && results !== undefined) {
      const resultsCount = Array.isArray(results) ? results.length : 0;
      announce(
        resultsCount === 0 
          ? `No se encontraron resultados para "${q}"` 
          : `Se encontraron ${resultsCount} resultado${resultsCount !== 1 ? 's' : ''} para "${q}"`, 
        'polite'
      );
    }
  }, [q, results, announce]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      {/* Skip link */}
      <a href="#search-results" className="skip-link">
        Saltar a los resultados de búsqueda
      </a>
      
      {/* Search section */}
      <section aria-label="Búsqueda de productos">
        <div className="max-w-2xl">
          <SearchBar 
            placeholder="Buscar productos..." 
            aria-label="Campo de búsqueda de productos"
          />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="number"
              className="h-9 w-full rounded-md border px-3 py-1 text-sm"
              placeholder="Precio mínimo"
              value={minPrice ?? ''}
              onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
              min={0}
              aria-label="Precio mínimo"
            />
            <input
              type="number"
              className="h-9 w-full rounded-md border px-3 py-1 text-sm"
              placeholder="Precio máximo"
              value={maxPrice ?? ''}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
              min={0}
              aria-label="Precio máximo"
            />
            <input
              type="text"
              className="h-9 w-full rounded-md border px-3 py-1 text-sm"
              placeholder="Etiquetas: fruta,bebida"
              value={tags.join(',')}
              onChange={(e) => setTags(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              aria-label="Etiquetas"
            />
          </div>
        </div>
      </section>
      
      {Array.isArray(results) && results.length > 0 && (
        <ItemListJsonLd
          itemListName={`Resultados para ${q}`}
          items={results.map((p) => ({
            url: `https://minimarket-aramac.local/products/${p.slug}`,
            name: p.name,
            image: p.images?.[0]?.url,
          }))}
        />
      )}
      
      {/* Results header */}
      <header>
        <h1 id="search-results" className="text-xl font-medium typography-hierarchy">
          {q ? `Resultados para "${q}"` : 'Búsqueda de productos'}
        </h1>
        {q && results !== undefined && (
          <p className="text-muted-foreground mt-2" aria-live="polite">
            {Array.isArray(results) && results.length > 0
              ? `${results.length} resultado${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`
              : 'No se encontraron resultados'
            }
          </p>
        )}
      </header>
      
      {/* Results grid */}
      {results === undefined ? (
        <CategoryGridSkeleton />
      ) : Array.isArray(results) && results.length > 0 ? (
        <section aria-label={`Resultados de búsqueda para ${q}`}>
          <div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            role="list"
            aria-label="Lista de productos encontrados"
          >
            {results.map((p, index: number) => (
              <div key={p._id} role="listitem">
                <ProductCard 
                  product={p}
                  priority={index < 8} // First 8 search results above fold
                  index={index}
                  onAddToCart={async (productId, quantity) => {
                    await addToCart({ 
                      productId, 
                      quantity, 
                      userId: userId ?? undefined, 
                      sessionId: userId ? undefined : sessionId 
                    });
                    announce(`${p.name} agregado al carrito`, 'polite');
                  }} 
                />
              </div>
            ))}
          </div>
        </section>
      ) : q ? (
        <section className="text-center py-12" aria-label="Sin resultados">
          <p className="text-muted-foreground text-lg">
            No se encontraron productos que coincidan con tu búsqueda.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Intenta con diferentes palabras clave o revisa las categorías disponibles.
          </p>
        </section>
      ) : (
        <section className="text-center py-12" aria-label="Instrucciones de búsqueda">
          <p className="text-muted-foreground text-lg">
            Usa el campo de búsqueda para encontrar productos.
          </p>
        </section>
      )}
    </main>
  );
}

export default function SearchPageClient() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-muted-foreground">Cargando resultados…</p>
        </main>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

