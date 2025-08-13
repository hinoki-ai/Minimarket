import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Locales | Minimarket ARAMAC",
	description: "Encuentra tu local más cercano de Minimarket ARAMAC.",
	alternates: { canonical: "/stores" },
};

export default function StoresPage() {
	return (
		<div className="mx-auto max-w-5xl px-6 py-10 space-y-4">
			<h1 className="text-2xl md:text-3xl font-semibold">Locales</h1>
			<p className="text-sm text-muted-foreground">
				Muy pronto: buscador de locales. Mientras tanto, contáctanos para confirmar tu
				punto de retiro o cobertura de despacho.
			</p>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="rounded-lg border p-4">
					<h2 className="font-medium">ARÁMAC Providencia</h2>
					<p className="text-sm text-muted-foreground">Av. Pedro de Valdivia 70, Santiago</p>
				</div>
				<div className="rounded-lg border p-4">
					<h2 className="font-medium">ARÁMAC Ñuñoa</h2>
					<p className="text-sm text-muted-foreground">Av. Irarrázaval 1234, Ñuñoa</p>
				</div>
			</div>
		</div>
	);
}

