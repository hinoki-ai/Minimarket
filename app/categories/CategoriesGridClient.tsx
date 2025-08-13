'use client';

import { CategoryGrid } from '@/components/ui/category-grid';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

export default function CategoriesGridClient() {
	const categoriesApi: any = (api as any).categories;
	const categories = useQuery(categoriesApi?.getCategoriesWithProductCount, {});
	if (!Array.isArray(categories)) {
		return (
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="h-28 rounded-lg border bg-muted animate-pulse" />
				))}
			</div>
		);
	}
	return <CategoryGrid categories={categories as any} layout="grid" />;
}

