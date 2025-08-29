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
        name: 'Camila Araya',
        role: 'Emprendedora',
        image: 'https://randomuser.me/api/portraits/women/52.jpg',
        quote: 'Desde Valpo controlo el local desde el celu. Inventario piola y alertas cuando falta producto. La raja.',
    },
    {
        name: 'Carlos Rojas',
        role: 'Administrador',
        image: 'https://randomuser.me/api/portraits/men/72.jpg',
        quote: 'Los turnos y cierres quedaron filete. Ahorramos 2 horas diarias entre reposición y caja. Reportes claritos.',
    },
    {
        name: 'Paula Muñoz',
        role: 'Dueña de almacén',
        image: 'https://randomuser.me/api/portraits/women/68.jpg',
        quote: 'En Puente Alto el cierre de caja me tomaba 1 hora; ahora 10 minutos. Boleta electrónica y stock al tiro: bacán.',
    },
    {
        name: 'Javier Pérez',
        role: 'Reponedor',
        image: 'https://randomuser.me/api/portraits/men/59.jpg',
        quote: 'Antes me perdía con SKUs; ahora cacho al tiro lo que falta. Menos vueltas al pasillo, más reposición.',
    },
    {
        name: 'Constanza Paredes',
        role: 'Dueña minimarket',
        image: 'https://randomuser.me/api/portraits/women/47.jpg',
        quote: 'Con Transbank y la caja, todo queda cuadrado. Antes perdíamos lucas; ahora tengo claro margen e IVA.',
    },
    {
        name: 'Felipe Contreras',
        role: 'Encargado de turno',
        image: 'https://randomuser.me/api/portraits/men/41.jpg',
        quote: 'Desde Maipú controlo precios y ofertas. Cuando llega proveedor, recibo con costo real. Cero drama.',
    },
    {
        name: 'Daniela Orellana',
        role: 'Dueña de negocio',
        image: 'https://randomuser.me/api/portraits/women/75.jpg',
        quote: 'Hice el cambio un lunes y el martes ya estábamos operando. Capacitar a la cajera tomó 20 minutos.',
    },
    {
        name: 'Tomás Herrera',
        role: 'Cajero',
        image: 'https://randomuser.me/api/portraits/men/33.jpg',
        quote: 'Los medios de pago no se caen y la fila avanza rápido. Imprimo boleta y chao, todo fluye.',
    },
    {
        name: 'Marcela Díaz',
        role: 'Comerciante',
        image: 'https://randomuser.me/api/portraits/women/21.jpg',
        quote: 'Pasamos de cuaderno a la plataforma y se notó altiro: la merma bajó 30% y hay más rotación.',
    },
    {
        name: 'Andrea Fuentes',
        role: 'Emprendedora',
        image: 'https://randomuser.me/api/portraits/women/65.jpg',
        quote: 'En 3 semanas ordené precios y promos. Subimos 12% las ventas del finde. Cero cacho para el equipo.',
    },
    // 10 items total kept intentionally for credibility and balance (6 mujeres, 4 hombres)
]

const animatedTestimonials: AnimatedTestimonial[] = testimonials.map((t) => ({
    quote: t.quote,
    name: t.name,
    designation: t.role,
    // Use remote images to avoid broken local overrides
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
