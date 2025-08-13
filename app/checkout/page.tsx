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
    <main className="mx-auto max-w-7xl px-6 py-8 lg:py-12 space-y-6 lg:space-y-8">
      <div className="text-center lg:text-left">
        <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold">Checkout</h1>
      </div>
      <CheckoutPageClient />
    </main>
  );
}