import type { Metadata } from "next";
import CartPageClient from './cart-client';

export const metadata: Metadata = {
  title: "Carrito de Compras | Minimarket ARAMAC",
  description: "Revisa los productos en tu carrito y procede al pago. Gestión fácil de tus compras en Minimarket ARAMAC.",
  alternates: { canonical: "/cart" },
  openGraph: {
    title: "Carrito de Compras | Minimarket ARAMAC",
    description: "Revisa los productos en tu carrito y procede al pago.",
  },
};

export default function CartPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold">Carrito</h1>
      <CartPageClient />
    </main>
  );
}