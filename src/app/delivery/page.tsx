import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Delivery | Minimarket ARAMAC",
	description: "Opciones de despacho y retiro para tus compras.",
	alternates: { canonical: "/delivery" },
};

export default function DeliveryPage() {
	return (
		<div className="mx-auto max-w-3xl px-6 py-10 space-y-4">
			<h1 className="text-2xl md:text-3xl font-semibold">Delivery</h1>
			<p className="text-sm text-muted-foreground">
				Pide por nuestras apps asociadas o coordina retiro en tienda.
			</p>
			<div className="grid gap-3 sm:grid-cols-2">
				<Link href="#" className="rounded-lg border p-4 subtle-hover">
					<span className="font-medium">Cornershop</span>
					<p className="text-xs text-muted-foreground">Próximamente</p>
				</Link>
				<Link href="#" className="rounded-lg border p-4 subtle-hover">
					<span className="font-medium">Rappi</span>
					<p className="text-xs text-muted-foreground">Próximamente</p>
				</Link>
			</div>
		</div>
	);
}

