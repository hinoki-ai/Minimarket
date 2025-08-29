import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
// import { useTheme } from 'next-themes'

export default function UserSection({ theme }: { isScrolled: boolean; theme: string | undefined }) {
    const appearance = {
        baseTheme: theme === 'dark' ? dark : undefined,
    }

    return (
        <>
            <AuthLoading>
                <div className="flex items-center justify-center">
                    <span className="sr-only">Cargando...</span>
                </div>
            </AuthLoading>
            <Authenticated>
                <Button asChild size="sm">
                    <Link href="/carrito">
                        <span>Mi Cuenta</span>
                    </Link>
                </Button>
                <UserButton appearance={appearance} />
            </Authenticated>

            <Unauthenticated>
                <div className="flex items-center gap-2 lg:gap-3">
                    <SignInButton mode="modal">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="font-medium hover:bg-accent/50 transition-colors"
                        >
                            Iniciar Sesión
                        </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                        <Button 
                            size="sm" 
                            className="font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Registrarse
                        </Button>
                    </SignUpButton>
                </div>
            </Unauthenticated>
        </>
    )
}