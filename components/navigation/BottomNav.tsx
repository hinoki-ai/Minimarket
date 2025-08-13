'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, Search, ShoppingCart, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGuestSessionId } from '@/hooks/use-guest-session'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'

// Lazy load heavy components
const CartItemCount = dynamic(() => import('@/components/header/CartItemCount'), { 
  ssr: false, 
  loading: () => null 
})
const SearchModal = dynamic(() => import('@/components/ui/search-bar').then(m => ({ default: m.SearchModal })), { 
  ssr: false 
})

export function BottomNav() {
  const pathname = usePathname()
  const sessionId = useGuestSessionId()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  // Hide on dashboard and admin pages
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')) {
    return null
  }

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: 'Inicio',
      isActive: pathname === '/'
    },
    {
      href: '/categories',
      icon: List,
      label: 'Categorías',
      isActive: pathname?.startsWith('/categories')
    },
    {
      href: '#search',
      icon: Search,
      label: 'Buscar',
      isActive: false,
      onClick: () => setIsSearchOpen(true)
    },
    {
      href: '/cart',
      icon: ShoppingCart,
      label: 'Carrito',
      isActive: pathname?.startsWith('/cart'),
      showCount: true
    },
    {
      href: '#account',
      icon: User,
      label: 'Cuenta',
      isActive: false,
      onClick: () => setIsAccountOpen(true)
    }
  ]

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden"
        role="navigation"
        aria-label="Navegación principal móvil"
      >
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isButton = item.onClick

              if (isButton) {
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 px-1 min-h-[4rem] text-xs font-medium transition-colors duration-200",
                      "hover:text-accent-foreground focus:text-accent-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background",
                      item.isActive ? "text-accent-foreground" : "text-muted-foreground"
                    )}
                    aria-label={`Abrir ${item.label.toLowerCase()}`}
                  >
                    <div className="relative">
                      <Icon className="h-5 w-5 mb-1" />
                      {item.showCount && (
                        <CartItemCount sessionId={sessionId ?? null} />
                      )}
                    </div>
                    <span className="leading-tight">{item.label}</span>
                  </button>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 min-h-[4rem] text-xs font-medium transition-colors duration-200",
                    "hover:text-accent-foreground focus:text-accent-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background",
                    item.isActive ? "text-accent-foreground" : "text-muted-foreground"
                  )}
                  aria-label={`Ir a ${item.label}`}
                  aria-current={item.isActive ? 'page' : undefined}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5 mb-1" />
                    {item.showCount && (
                      <CartItemCount sessionId={sessionId ?? null} />
                    )}
                  </div>
                  <span className="leading-tight">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Search Modal */}
      {isSearchOpen && (
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      )}

      {/* Account Sheet */}
      <Sheet open={isAccountOpen} onOpenChange={setIsAccountOpen}>
        <SheetContent side="bottom" className="rounded-t-xl border-t">
          <SheetHeader>
            <SheetTitle>Tu cuenta</SheetTitle>
            <SheetDescription>Accesos rápidos y configuración</SheetDescription>
          </SheetHeader>
          <div className="p-2 mt-4">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <Link 
                href="/cart#profile" 
                className="flex flex-col items-center justify-center rounded-lg border p-4 hover:bg-accent transition-colors"
                onClick={() => setIsAccountOpen(false)}
              >
                <User className="h-6 w-6 mb-2" />
                <span>Perfil</span>
              </Link>
              <Link 
                href="/cart#orders" 
                className="flex flex-col items-center justify-center rounded-lg border p-4 hover:bg-accent transition-colors"
                onClick={() => setIsAccountOpen(false)}
              >
                <ShoppingCart className="h-6 w-6 mb-2" />
                <span>Pedidos</span>
              </Link>
              <button
                type="button"
                className="flex flex-col items-center justify-center rounded-lg border p-4 hover:bg-accent transition-colors"
                onClick={() => {
                  setIsAccountOpen(false)
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-cookie-settings', { detail: { tab: 'summary' } }))
                  }
                }}
              >
                <span className="h-6 w-6 mb-2 rounded-full border flex items-center justify-center text-sm font-medium">i</span>
                <span>Privacidad</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}