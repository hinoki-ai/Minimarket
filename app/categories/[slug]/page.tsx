'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ProductCard } from '@/components/ui/product-card';
import { CategoryBreadcrumb } from '@/components/ui/category-grid';
import { useAuth } from '@clerk/nextjs';
import { useGuestSessionId } from '@/hooks/use-guest-session';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { ItemListJsonLd } from '@/components/seo/ItemListJsonLd';

export default function CategoryPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string);
  const category = useQuery(api.categories.getCategoryBySlug, slug ? { slug } : undefined) as any;
  const products = useQuery(api.products.getProducts, category ? { categoryId: category._id, limit: 24, sortBy: 'newest' } : undefined) as any[] | undefined;
  const breadcrumb = useQuery(api.categories.getCategoryBreadcrumb, category ? { categoryId: category._id } : undefined) as any[] | undefined;

  const { userId } = useAuth();
  const sessionId = useGuestSessionId();
const cartsApi: any = (api as any).carts;
const addToCart = useMutation(cartsApi?.addToCart);

  if (!category) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-muted-foreground">Cargando categoría...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
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
      {Array.isArray(breadcrumb) && (
        <CategoryBreadcrumb categories={breadcrumb as any} />
      )}
      <h1 className="text-2xl md:text-3xl font-semibold">{category.name}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(products ?? []).map((p: any) => (
          <ProductCard key={p._id} product={p} onAddToCart={async (productId, quantity) => {
            await addToCart({ productId, quantity, userId: userId ?? undefined, sessionId: userId ? undefined : sessionId });
          }} />
        ))}
      </div>
    </div>
  );
}

