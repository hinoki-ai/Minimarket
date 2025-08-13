import type { Metadata } from 'next';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ProductCard } from '@/components/ui/product-card';

export const metadata: Metadata = {
	title: 'Promociones | Minimarket ARAMAC',
	description: 'Ofertas, descuentos y cupones vigentes en Minimarket ARAMAC.',
	alternates: { canonical: '/promotions' },
};

export default function PromotionsPage() {
	return (
		<div className="mx-auto max-w-7xl px-6 py-10 space-y-6">
			<h1 className="text-2xl md:text-3xl font-semibold">Promociones</h1>
			<p className="text-sm text-muted-foreground">Explora productos en oferta y cupones activos. Aplicaremos el mejor descuento disponible automáticamente al pagar.</p>
			<PromotionsClient />
		</div>
	);
}

function PromotionsClient() {
	'use client';
	const productsApi: any = (api as any).products;
	// Placeholder: reuse featured products until a dedicated promotions flag exists
	const featured = useQuery(productsApi?.getFeaturedProducts, { limit: 24 });
	if (!Array.isArray(featured)) {
		return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-64 rounded-lg border bg-card animate-pulse" />))}</div>;
	}
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
			{featured.map((p: any, idx: number) => (
				<ProductCard key={p._id} product={p} index={idx} onAddToCart={() => {}} />
			))}
		</div>
	);
}

