import type { Metadata } from "next";
import CheckoutPageClient from './checkout-client';

export const metadata: Metadata = {
  title: "Checkout | Minimarket ARAMAC",
  description: "Finaliza tu compra de manera segura y rápida. Ingresa tus datos y confirma tu pedido en Minimarket ARAMAC.",
  alternates: { canonical: "/checkout" },
  openGraph: {
    title: "Checkout | Minimarket ARAMAC",
    description: "Finaliza tu compra de manera segura y rápida.",
  },
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold">Checkout</h1>
      <CheckoutPageClient />
    </main>
  );
}