import type { Metadata } from 'next';
import CategoryPageClient from './category-client';

type PageProps = {
  params?: Promise<any>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = params ? await params : undefined;
  const slug = typeof resolved?.slug === 'string' ? resolved.slug : '';
  const name = decodeURIComponent(slug).replace(/-/g, ' ').trim();
  const title = name ? `Categoría: ${name} | Minimarket ARAMAC` : 'Categoría | Minimarket ARAMAC';
  const description = name
    ? `Explora productos en la categoría ${name} en Minimarket ARAMAC.`
    : 'Explora productos por categoría en Minimarket ARAMAC.';
  return {
    title,
    description,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: {
      title,
      description,
      url: `/categories/${slug}`,
    },
  };
}

export default function CategoryPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold">Categoría</h1>
      <CategoryPageClient />
    </main>
  );
}

