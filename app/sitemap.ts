import type { MetadataRoute } from 'next';
import { api } from '@/convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://minimarket-aramac.local';

  // Fetch dynamic routes without mutating anything
  const [products, categories] = await Promise.all([
    fetchQuery(api.products.getProducts, { limit: 100, sortBy: 'newest' }).catch(() => []),
    fetchQuery(api.categories.getCategories, { includeInactive: false }).catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/products',
    '/dashboard',
    '/checkout',
    '/search',
  ].map((path) => ({ url: `${baseUrl}${path}`, changeFrequency: 'weekly', priority: 0.7 }));

  const productRoutes: MetadataRoute.Sitemap = (products as any[]).map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (categories as any[]).map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}

