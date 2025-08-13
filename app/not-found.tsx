import SplashCursor from '@/components/react-bits/splash-cursor'
import Link from 'next/link'
import { IconArrowRight } from '@tabler/icons-react'


export default function NotFoundPage() {
    return (
        <section className="min-h-[80vh] flex flex-col items-center justify-center bg-background text-foreground px-6">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-center">Página no encontrada</h1>
            <p className="text-muted-foreground mt-4 text-center">
                Lo sentimos, no pudimos encontrar lo que buscas.
            </p>
            <Link href="/" className="mt-10 inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground subtle-hover">
                <span>Volver al inicio</span>
                <IconArrowRight className="ml-2" />
            </Link>
            <div className="mt-8 opacity-40">
                <SplashCursor />
            </div>
        </section>
    )
}