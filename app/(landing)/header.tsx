'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChatMaxingIconColoured } from '@/components/logo'
import { Loader2, Menu, X, ShoppingCart, Home, List, User, Search as SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

import { dark } from '@clerk/themes'
import { useTheme } from "next-themes"
import { useAuth } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useGuestSessionId } from '@/hooks/use-guest-session'
import { SearchBar, SearchBarCompact, SearchModal } from '@/components/ui/search-bar'



const menuItems = [
    { name: 'Características', href: '#link' },
    { name: 'Solución', href: '#link' },
    { name: 'Precios', href: '#link' },
    { name: 'Acerca de', href: '#link' },
]

export const HeroHeader = () => {
    const pathname = usePathname()
    const isDashboard = pathname?.startsWith('/dashboard') ?? false
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isSearchOpen, setIsSearchOpen] = React.useState(false)
    const mobileMenuRef = React.useRef<HTMLDivElement | null>(null)
    const { theme } = useTheme()
    const { userId } = useAuth()
    const sessionId = useGuestSessionId()

    // Guard Convex generated API in environments where carts may not be present in types
    const cartsApi: any = (api as any).carts
    const itemCount = useQuery(
        cartsApi?.getCartItemCount,
        (userId || sessionId) && cartsApi?.getCartItemCount ? { userId: userId ?? undefined, sessionId: userId ? undefined : sessionId } : undefined
    ) ?? 0

    const appearance = {
        baseTheme: theme === "dark" ? dark : undefined,
    }

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Basic focus trap for mobile menu when open
    React.useEffect(() => {
        if (!menuState) return
        const container = mobileMenuRef.current
        if (!container) return
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ]
        const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors.join(',')))

        const focusables = getFocusable()
        if (focusables.length > 0) {
            focusables[0].focus()
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMenuState(false)
                return
            }
            if (e.key !== 'Tab') return
            const list = getFocusable()
            if (list.length === 0) return
            const first = list[0]
            const last = list[list.length - 1]
            const active = document.activeElement as HTMLElement | null
            if (e.shiftKey) {
                if (active === first || !container.contains(active)) {
                    e.preventDefault()
                    last.focus()
                }
            } else {
                if (active === last) {
                    e.preventDefault()
                    first.focus()
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [menuState])
    if (isDashboard) return null

    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <ChatMaxingIconColoured />
                                <span className="text-xl font-medium">Minimarket ARAMAC</span>
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Cerrar menú' : 'Abrir menú'}
                                aria-expanded={menuState}
                                aria-controls="mobile-menu"
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <div className="flex items-center gap-6">
                                <ul className="flex gap-8 text-sm">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                                <SearchBar className="min-w-[320px]" placeholder="Buscar productos..." />
                            </div>
                        </div>

                        <div
                            id="mobile-menu"
                            ref={mobileMenuRef}
                            className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent"
                            aria-hidden={!menuState}
                        >
                            {/* Mobile search compact trigger */}
                            <div className="w-full lg:hidden">
                                <SearchBarCompact onFocus={() => setIsSearchOpen(true)} />
                            </div>
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit items-center">
                                <Link href="/cart" className="relative inline-flex items-center justify-center h-10 w-10 rounded-full border subtle-hover">
                                    <ShoppingCart className="h-5 w-5" />
                                    {itemCount > 0 && (
                                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
                                            {itemCount}
                                        </span>
                                    )}
                                </Link>
                                <AuthLoading>
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="size-8 p-2 animate-spin" />
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
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className={cn(isScrolled && 'lg:hidden')}>
                                            <Link href="#">
                                                <span>Ingresar</span>
                                            </Link>
                                        </Button>
                                    </SignInButton>
                                    <SignUpButton mode="modal">
                                        <Button
                                            asChild
                                            size="sm"
                                            className={cn(isScrolled && 'lg:hidden')}>
                                            <Link href="#">
                                                <span>Crear cuenta</span>
                                            </Link>
                                        </Button>
                                    </SignUpButton>
                                    <SignUpButton mode="modal">
                                        <Button
                                            asChild
                                            size="sm"
                                            className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}>
                                            <Link href="#">
                                                <span>Comenzar</span>
                                            </Link>
                                        </Button>
                                    </SignUpButton>
                                </Unauthenticated>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            {/* Mobile bottom navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
                <div className="mx-auto max-w-4xl">
                    <div className="grid grid-cols-5 text-xs">
                        <Link href="/" className="flex flex-col items-center justify-center py-2">
                            <Home className="h-5 w-5" />
                            <span>Inicio</span>
                        </Link>
                        <Link href="/#categorias" className="flex flex-col items-center justify-center py-2">
                            <List className="h-5 w-5" />
                            <span>Categorías</span>
                        </Link>
                        <button onClick={() => setIsSearchOpen(true)} className="flex flex-col items-center justify-center py-2">
                            <SearchIcon className="h-5 w-5" />
                            <span>Buscar</span>
                        </button>
                        <Link href="/cart" className="flex flex-col items-center justify-center py-2 relative">
                            <ShoppingCart className="h-5 w-5" />
                            {itemCount > 0 && (
                                <span className="absolute top-1 right-6 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
                                    {itemCount}
                                </span>
                            )}
                            <span>Carrito</span>
                        </Link>
                        {userId ? (
                            <Link href="/dashboard" className="flex flex-col items-center justify-center py-2">
                                <User className="h-5 w-5" />
                                <span>Cuenta</span>
                            </Link>
                        ) : (
                            <Link href="#" className="flex flex-col items-center justify-center py-2">
                                <User className="h-5 w-5" />
                                <span>Cuenta</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </header>
    )
}
