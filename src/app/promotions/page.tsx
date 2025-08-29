import type { Metadata } from 'next';
import PromotionsClient from './PromotionsClient';

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

