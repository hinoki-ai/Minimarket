'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChatMaxingIconColoured } from '@/components/logo'
import { Loader2, Menu, X, ShoppingCart } from 'lucide-react'
// import { Button } from '@/components/ui/button'
import React from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { useTheme } from "next-themes"
import { useGuestSessionId } from '@/hooks/use-guest-session'
import { SearchBar, SearchBarCompact } from '@/components/ui/search-bar'

// Defer heavy auth and data-fetching code paths
const UserSection = dynamic(() => import('@/components/header/UserSection'), { ssr: false, loading: () => (
    <div className="flex items-center justify-center">
        <Loader2 className="size-8 p-2 animate-spin" />
    </div>
) })
const CartItemCount = dynamic(() => import('@/components/header/CartItemCount'), { ssr: false, loading: () => null })
const SearchModal = dynamic(() => import('@/components/ui/search-bar').then(m => ({ default: m.SearchModal })), { ssr: false })



const menuItems = [
	{ name: 'Promociones', href: '/promotions' },
	{ name: 'Categorías', href: '/categories' },
	{ name: 'Locales', href: '/stores' },
	{ name: 'Delivery', href: '/delivery' },
	{ name: 'Ayuda', href: '/help' },
]

export const HeroHeader = () => {
    const pathname = usePathname()
    const isDashboard = pathname?.startsWith('/carrito') ?? false
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isSearchOpen, setIsSearchOpen] = React.useState(false)
    const mobileMenuRef = React.useRef<HTMLDivElement | null>(null)
    const { theme } = useTheme()
    const sessionId = useGuestSessionId()

    React.useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY
            setIsScrolled(scrollY > 50)
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
                <div className={cn(
                    'mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12 xl:max-w-7xl',
                    isScrolled && 'bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 max-w-5xl xl:max-w-6xl rounded-2xl border shadow-lg lg:px-8 xl:px-10'
                )}>
                    <div className={cn(
                        "relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-8 xl:gap-12 transition-all duration-300",
                        isScrolled ? "lg:py-3 xl:py-3" : "lg:py-4 xl:py-5"
                    )}>
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2 lg:space-x-3">
                                <ChatMaxingIconColoured />
                                <span className={cn(
                                    "font-medium transition-all duration-300",
                                    isScrolled 
                                        ? "text-lg lg:text-xl xl:text-2xl" 
                                        : "text-xl lg:text-2xl xl:text-3xl"
                                )}>
                                    Minimarket ARAMAC
                                </span>
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

                        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center lg:gap-8 xl:gap-12">
                            <ul className="flex gap-6 xl:gap-8 text-sm lg:text-base">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="text-muted-foreground hover:text-accent-foreground block duration-150 whitespace-nowrap">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="hidden lg:flex lg:items-center lg:flex-1 lg:justify-center lg:max-w-md xl:max-w-lg">
                            <SearchBar className="w-full" placeholder="Buscar productos..." />
                        </div>

                        <div className="hidden lg:flex lg:items-center lg:gap-4 xl:gap-6">
                            <Link href="/carrito" aria-label="Abrir carrito" className="relative inline-flex items-center justify-center h-10 w-10 lg:h-12 lg:w-12 rounded-full border subtle-hover">
                                <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6" />
                                <CartItemCount sessionId={sessionId ?? null} />
                            </Link>
                            <UserSection isScrolled={isScrolled} theme={theme} />
                        </div>

                        <div
                            id="mobile-menu"
                            ref={mobileMenuRef}
                            className="bg-background in-data-[state=active]:block mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:hidden"
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
                                <Link href="/carrito" aria-label="Abrir carrito" className="relative inline-flex items-center justify-center h-10 w-10 rounded-full border subtle-hover">
                                    <ShoppingCart className="h-5 w-5" />
                                    <CartItemCount sessionId={sessionId ?? null} />
                                </Link>
                                <UserSection isScrolled={isScrolled} theme={theme} />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            {isSearchOpen ? (
                <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            ) : null}
        </header>
    )
}
