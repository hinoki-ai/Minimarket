import type { Metadata } from "next";
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "Carrito | Redirigiendo…",
  description: "Esta ruta ahora es Carrito. Redirigiendo a /carrito.",
  alternates: { canonical: "/carrito" },
  openGraph: {
    title: "Carrito | Minimarket ARAMAC",
    description: "Carrito, pedidos y perfil en un solo lugar.",
    url: "/carrito",
  },
};

export default function CartPage() {
  redirect('/carrito')
}