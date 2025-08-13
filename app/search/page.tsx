import type { Metadata } from 'next';
import SearchPageClient from './search-client';

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const q = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
  const baseTitle = q ? `Buscar "${q}"` : 'Buscar productos';
  const title = `${baseTitle} | Minimarket ARAMAC`;
  const description = q
    ? `Resultados de búsqueda para \"${q}\" en Minimarket ARAMAC.`
    : 'Busca y encuentra productos en Minimarket ARAMAC.';
  return {
    title,
    description,
    alternates: { canonical: '/search' },
    openGraph: {
      title,
      description,
      url: q ? `/search?q=${encodeURIComponent(q)}` : '/search',
    },
  };
}

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold">Buscar</h1>
      <SearchPageClient />
    </main>
  );
}

