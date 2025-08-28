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
      <main className="relative z-40 mx-auto max-w-7xl px-6 py-8 lg:py-12 space-y-6 lg:space-y-8" style={{ isolation: 'isolate' }}>
        <HomeClient />
      </main>
    </AuroraBackground>
  );
}
