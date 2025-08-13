import type { Metadata } from 'next';
import ProductDetailClient from './product-client';

type PageProps = {
  params?: Promise<any>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = params ? await params : undefined;
  const slug = typeof resolved?.slug === 'string' ? resolved.slug : '';
  const name = decodeURIComponent(slug).replace(/-/g, ' ').trim();
  const title = name ? `${name} | Minimarket ARAMAC` : 'Producto | Minimarket ARAMAC';
  const description = name
    ? `Descubre ${name} y sus detalles en Minimarket ARAMAC.`
    : 'Descubre los detalles de este producto en Minimarket ARAMAC.';
  return {
    title,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title,
      description,
      url: `/products/${slug}`,
    },
  };
}

export default function ProductDetailPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold">Producto</h1>
      <ProductDetailClient />
    </main>
  );
}

