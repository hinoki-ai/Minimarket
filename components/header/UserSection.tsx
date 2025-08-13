import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
// import { useTheme } from 'next-themes'

export default function UserSection({ isScrolled, theme }: { isScrolled: boolean; theme: string | undefined }) {
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
                    <Link href="/dashboard">
                        <span>Panel</span>
                    </Link>
                </Button>
                <UserButton appearance={appearance} />
            </Authenticated>

            <Unauthenticated>
                <SignInButton mode="modal">
                    <Button asChild variant="outline" size="sm" className={cn(isScrolled && 'lg:hidden')}>
                        <Link href="#">
                            <span>Ingresar</span>
                        </Link>
                    </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                    <Button asChild size="sm" className={cn(isScrolled && 'lg:hidden')}>
                        <Link href="#">
                            <span>Crear cuenta</span>
                        </Link>
                    </Button>
                </SignUpButton>
                <SignUpButton mode="modal">
                    <Button asChild size="sm" className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}>
                        <Link href="#">
                            <span>Comenzar</span>
                        </Link>
                    </Button>
                </SignUpButton>
            </Unauthenticated>
        </>
    )
}