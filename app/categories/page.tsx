import type { Metadata } from 'next';
import { CategoryGrid } from '@/components/ui/category-grid';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

export const metadata: Metadata = {
	title: 'Categorías | Minimarket ARAMAC',
	description: 'Explora todas las categorías de productos de Minimarket ARAMAC.',
	alternates: { canonical: '/categories' },
};

export default function CategoriesIndexPage() {
	// Client component boundary wrapper to use convex hook
	return (
		<div className="mx-auto max-w-7xl px-6 py-10 space-y-4">
			<h1 className="text-2xl md:text-3xl font-semibold">Categorías</h1>
			<CategoriesGridClient />
		</div>
	);
}

function CategoriesGridClient() {
	'use client';
	const categoriesApi: any = (api as any).categories;
	const categories = useQuery(categoriesApi?.getCategoriesWithProductCount, {});
	if (!Array.isArray(categories)) {
		return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-28 rounded-lg border bg-muted animate-pulse" />))}</div>;
	}
	return <CategoryGrid categories={categories as any} layout="grid" />;
}

