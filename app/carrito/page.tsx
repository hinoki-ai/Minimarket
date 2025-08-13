import type { Metadata } from "next";
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "Carrito | Redirigiendo…",
  description: "Esta ruta ahora es Mi Cuenta. Redirigiendo a /dashboard.",
  alternates: { canonical: "/dashboard" },
  openGraph: {
    title: "Mi Cuenta | Minimarket ARAMAC",
    description: "Carrito, pedidos y perfil en un solo lugar.",
    url: "/dashboard",
  },
};

export default function CarritoPage() {
  redirect('/dashboard')
}