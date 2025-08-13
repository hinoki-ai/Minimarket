import type { Metadata } from "next";
import ProductsPageClient from './products-client';

export const metadata: Metadata = {
  title: "Productos | Minimarket ARAMAC",
  description: "Explora nuestro catálogo completo de productos frescos y de calidad. Encuentra todo lo que necesitas para tu hogar.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: "Productos | Minimarket ARAMAC",
    description: "Explora nuestro catálogo completo de productos frescos y de calidad.",
  },
};

export default function ProductsPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 lg:py-12 space-y-6 lg:space-y-8">
      <div className="text-center lg:text-left">
        <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold">Productos</h1>
      </div>
      <ProductsPageClient />
    </main>
  );
}