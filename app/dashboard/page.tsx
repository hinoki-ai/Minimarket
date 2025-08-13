import type { Metadata } from 'next';
import { Protect, SignInButton } from '@clerk/nextjs'
import CarritoPageClient from '../carrito/carrito-client'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Mi Cuenta | Minimarket ARAMAC',
  description: 'Carrito, pedidos y perfil en un solo lugar. Solo para usuarios registrados.',
  alternates: { canonical: '/dashboard' },
  openGraph: {
    title: 'Mi Cuenta | Minimarket ARAMAC',
    description: 'Carrito, pedidos y perfil en un solo lugar. Solo para usuarios registrados.',
    url: '/dashboard',
  },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 lg:py-12 space-y-6 lg:space-y-8">
      <h1 className="text-2xl md:text-3xl font-semibold">Mi Cuenta</h1>
      <Protect
        fallback={(
          <div className="mx-auto max-w-xl text-center space-y-4">
            <h1 className="text-2xl md:text-3xl font-semibold">Inicia sesión para continuar</h1>
            <p className="text-muted-foreground">Accede a tu cuenta para ver tu carrito, pedidos y perfil.</p>
            <SignInButton mode="modal">
              <Button size="lg">Iniciar sesión</Button>
            </SignInButton>
          </div>
        )}
      >
        <CarritoPageClient />
      </Protect>
    </main>
  );
}
