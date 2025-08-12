import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck, CreditCard, Lock } from 'lucide-react'

type Testimonial = {
    name: string
    role: string
    image: string
    quote: string
}

const testimonials: Testimonial[] = [
    {
        name: 'Paula Muñoz',
        role: 'Dueña de almacén',
        image: 'https://randomuser.me/api/portraits/men/1.jpg',
        quote: 'Minimarket ARAMAC nos simplificó el día a día. Rápido, claro y muy fácil.',
    },
    {
        name: 'Carlos Rojas',
        role: 'Administrador',
        image: 'https://randomuser.me/api/portraits/men/6.jpg',
        quote: 'La gestión es simple y ordenada. Ideal para negocios locales.',
    },
    {
        name: 'Andrea Fuentes',
        role: 'Emprendedora',
        image: 'https://randomuser.me/api/portraits/men/7.jpg',
        quote: 'Servicio confiable y muy intuitivo. Lo recomiendo.',
    },
    {
        name: 'Javier Pérez',
        role: 'Reponedor',
        image: 'https://randomuser.me/api/portraits/men/4.jpg',
        quote: 'Nos ayudó a ordenar inventario y ventas sin enredos.',
    },
    {
        name: 'Marcela Díaz',
        role: 'Comerciante',
        image: 'https://randomuser.me/api/portraits/men/2.jpg',
        quote: 'Rápido de implementar y muy fácil para el equipo.',
    },
    {
        name: 'Tomás Herrera',
        role: 'Cajero',
        image: 'https://randomuser.me/api/portraits/men/6.jpg',
        quote: 'Atención amable y plataforma estable. Muy buena experiencia.',
    },
]

const chunkArray = (array: Testimonial[], chunkSize: number): Testimonial[][] => {
    const result: Testimonial[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize))
    }
    return result
}

const testimonialChunks = chunkArray(testimonials, Math.ceil(testimonials.length / 3))

export default function WallOfLoveSection() {
    return (
        <section>
            <div className="py-16 md:py-32">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="text-center">
                        <h2 className="text-foreground text-4xl font-semibold">Clientes felices</h2>
                        <p className="text-muted-foreground mb-8 mt-4 text-balance text-lg">Rápido, claro y confiable para negocios locales en Chile.</p>
                        {/* Trust badges */}
                        <div className="mx-auto mb-8 flex flex-wrap items-center justify-center gap-3 text-sm">
                            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
                                <ShieldCheck className="h-4 w-4" /> Convex en tiempo real
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
                                <CreditCard className="h-4 w-4" /> Pagos seguros con Stripe
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
                                <Lock className="h-4 w-4" /> Sesiones protegidas con Clerk
                            </span>
                        </div>
                    </div>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-12 lg:grid-cols-3">
                        {testimonialChunks.map((chunk, chunkIndex) => (
                            <div
                                key={chunkIndex}
                                className="space-y-3">
                                {chunk.map(({ name, role, quote, image }, index) => (
                                    <Card key={index}>
                                        <CardContent className="grid grid-cols-[auto_1fr] gap-3 pt-6">
                                            <Avatar className="size-9">
                                                <AvatarImage
                                                    alt={name}
                                                    src={image}
                                                    loading="lazy"
                                                    width="120"
                                                    height="120"
                                                />
                                                <AvatarFallback>MA</AvatarFallback>
                                            </Avatar>

                                            <div>
                                                <h3 className="font-medium">{name}</h3>

                                                <span className="text-muted-foreground block text-sm tracking-wide">{role}</span>

                                                <blockquote className="mt-3">
                                                    <p className="text-gray-700 dark:text-gray-300">{quote}</p>
                                                </blockquote>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
