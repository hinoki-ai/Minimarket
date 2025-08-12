'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ProductCard } from '@/components/ui/product-card';
import { useAuth } from '@clerk/nextjs';
import { useGuestSessionId } from '@/hooks/use-guest-session';
import { SearchBar } from '@/components/ui/search-bar';
import { ItemListJsonLd } from '@/components/seo/ItemListJsonLd';
import { useScreenReader } from '@/lib/accessibility';

export default function SearchPage() {
  const sp = useSearchParams();
  const q = sp.get('q') || '';
  const { announce } = useScreenReader();
  
  const productsApi: any = (api as any).products;
  const results = useQuery(productsApi?.searchProducts, q ? { searchTerm: q, limit: 24 } : undefined) as any[] | undefined;

  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
  const cartsApi: any = (api as any).carts;
  const addToCart = useMutation(cartsApi?.addToCart);
  
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
        </div>
      </section>
      
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
      {Array.isArray(results) && results.length > 0 ? (
        <section aria-label={`Resultados de búsqueda para ${q}`}>
          <div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            role="list"
            aria-label="Lista de productos encontrados"
          >
            {results.map((p: any, index: number) => (
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

