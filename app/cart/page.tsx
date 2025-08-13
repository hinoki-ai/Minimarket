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
    <main className="mx-auto max-w-7xl px-6 py-8 lg:py-12 space-y-6 lg:space-y-8">
      <div className="text-center lg:text-left">
        <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold">Carrito</h1>
      </div>
      <CartPageClient />
    </main>
  );
}