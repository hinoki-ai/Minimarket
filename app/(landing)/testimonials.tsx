import { ShieldCheck, CreditCard, Lock } from 'lucide-react'
import AnimatedTestimonials, { type AnimatedTestimonial } from '@/components/ui/animated-testimonials'

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

const animatedTestimonials: AnimatedTestimonial[] = testimonials.map((t) => ({
    quote: t.quote,
    name: t.name,
    designation: t.role,
    src: t.image,
}))

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
                    <div className="mt-8 md:mt-12">
                        <AnimatedTestimonials testimonials={animatedTestimonials} autoplay />
                    </div>
                </div>
            </div>
        </section>
    )
}
