'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ProductCard } from '@/components/ui/product-card';

export default function PromotionsClient() {
	const productsApi: any = (api as any).products;
	const featured = useQuery(productsApi?.getFeaturedProducts, { limit: 24 });
	if (!Array.isArray(featured)) {
		return (
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="h-64 rounded-lg border bg-card animate-pulse" />
				))}
			</div>
		);
	}
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
			{featured.map((p: any, idx: number) => (
				<ProductCard key={p._id} product={p} index={idx} onAddToCart={() => {}} />
			))}
		</div>
	);
}

