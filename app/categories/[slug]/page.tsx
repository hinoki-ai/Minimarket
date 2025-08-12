'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ProductCard } from '@/components/ui/product-card';
import { CategoryBreadcrumb } from '@/components/ui/category-grid';
import { useAuth } from '@clerk/nextjs';
import { useGuestSessionId } from '@/hooks/use-guest-session';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { ItemListJsonLd } from '@/components/seo/ItemListJsonLd';
import { useScreenReader } from '@/lib/accessibility';

export default function CategoryPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string);
  const { announce } = useScreenReader();
  
  const categoriesApi: any = (api as any).categories;
  const productsApi: any = (api as any).products;
  const category = useQuery(categoriesApi?.getCategoryBySlug, slug ? { slug } : undefined) as any;
  const products = useQuery(productsApi?.getProducts, category ? { categoryId: category._id, limit: 24, sortBy: 'newest' } : undefined) as any[] | undefined;
  const breadcrumb = useQuery(categoriesApi?.getCategoryBreadcrumb, category ? { categoryId: category._id } : undefined) as any[] | undefined;

  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
  const cartsApi: any = (api as any).carts;
  const addToCart = useMutation(cartsApi?.addToCart);
  
  // Announce when products are loaded
  useEffect(() => {
    if (category && products && Array.isArray(products)) {
      announce(`Categoría ${category.name} cargada con ${products.length} productos`, 'polite');
    }
  }, [category, products, announce]);

  if (!category) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-muted-foreground">Cargando categoría...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      {/* Skip link */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      
      {category && (
        <BreadcrumbJsonLd
          items={[
            { name: 'Inicio', url: 'https://minimarket-aramac.local/' },
            { name: 'Categorías', url: 'https://minimarket-aramac.local/products' },
            { name: category.name, url: `https://minimarket-aramac.local/categories/${category.slug}` },
          ]}
        />
      )}
      {Array.isArray(products) && products.length > 0 && (
        <ItemListJsonLd
          itemListName={`Productos en ${category.name}`}
          items={(products as any[]).map((p: any) => ({
            url: `https://minimarket-aramac.local/products/${p.slug}`,
            name: p.name,
            image: p.images?.[0]?.url,
          }))}
        />
      )}
      
      {/* Navigation breadcrumb */}
      {Array.isArray(breadcrumb) && (
        <nav aria-label="Navegación de categorías" role="navigation">
          <CategoryBreadcrumb categories={breadcrumb as any} />
        </nav>
      )}
      
      {/* Main heading */}
      <header>
        <h1 id="main-content" className="text-2xl md:text-3xl font-semibold typography-hierarchy">
          {category.name}
        </h1>
        {Array.isArray(products) && (
          <p className="text-muted-foreground mt-2" aria-live="polite">
            {products.length === 0 
              ? 'No hay productos disponibles en esta categoría' 
              : `${products.length} producto${products.length !== 1 ? 's' : ''} disponible${products.length !== 1 ? 's' : ''}`
            }
          </p>
        )}
      </header>
      
      {/* Products grid */}
      {Array.isArray(products) && products.length > 0 ? (
        <section aria-label={`Productos en categoría ${category.name}`}>
          <div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            role="list"
            aria-label="Lista de productos"
          >
            {products.map((p: any, index: number) => (
              <div key={p._id} role="listitem">
                <ProductCard 
                  product={p}
                  priority={index < 8} // First 8 products above fold
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
      ) : (
        <section className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No hay productos disponibles en esta categoría.
          </p>
        </section>
      )}
    </main>
  );
}

