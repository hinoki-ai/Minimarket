import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Ayuda | Minimarket ARAMAC",
	description: "Centro de ayuda, preguntas frecuentes y contacto.",
	alternates: { canonical: "/help" },
};

export default function HelpPage() {
	return (
		<div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
			<h1 className="text-2xl md:text-3xl font-semibold">Ayuda</h1>
			<div className="space-y-3">
				<h2 className="font-medium">Preguntas frecuentes</h2>
				<ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
					<li>¿Cuáles son los horarios de entrega?</li>
					<li>¿Puedo retirar en tienda?</li>
					<li>¿Cómo rastreo mi pedido?</li>
				</ul>
			</div>
			<div className="space-y-2">
				<h2 className="font-medium">Contacto</h2>
				<p className="text-sm text-muted-foreground">contacto@minimarket-aramac.local</p>
			</div>
		</div>
	);
}

