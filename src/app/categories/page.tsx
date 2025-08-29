import type { Metadata } from 'next';
import CategoriesGridClient from './CategoriesGridClient';

export const metadata: Metadata = {
	title: 'Categorías | Minimarket ARAMAC',
	description: 'Explora todas las categorías de productos de Minimarket ARAMAC.',
	alternates: { canonical: '/categories' },
};

export default function CategoriesIndexPage() {
    return (
        <div className="mx-auto max-w-7xl px-6 py-10 space-y-4">
            <h1 className="text-2xl md:text-3xl font-semibold">Categorías</h1>
            <CategoriesGridClient />
        </div>
    );
}

