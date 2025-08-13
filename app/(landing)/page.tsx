import type { Metadata } from "next";
import HomeClient from "./home-client";
import { AuroraBackground } from "@/components/ui/aurora-background";

export const metadata: Metadata = {
  title: "Inicio | Minimarket ARAMAC",
  description: "Compra fácil y gestión clara para tu negocio local.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Inicio | Minimarket ARAMAC",
    description: "Compra fácil y gestión clara para tu negocio local.",
    url: "/",
  },
};

export default function HomePage() {
  return (
    <AuroraBackground>
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8 space-y-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Inicio</h1>
        <HomeClient />
      </main>
    </AuroraBackground>
  );
}
