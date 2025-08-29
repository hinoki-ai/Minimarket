import React, { createContext, useContext, useState, useEffect } from 'react'

// Locales supported by the minimarket platform
export const locales = ['en', 'es'] as const
export type Locale = (typeof locales)[number]

// Type for nested translation objects
type TranslationValue = string | string[] | { [key: string]: TranslationValue }

// Divine Parsing Oracle - Minimarket EN/ES translations
const translations = {
  en: {
    // Navigation & Global
    nav: {
      home: 'Home',
      products: 'Products',
      categories: 'Categories',
      cart: 'Cart',
      checkout: 'Checkout',
      account: 'Account',
      contact: 'Contact',
      search: 'Search products...',
      languageToggle: 'Toggle language',
    },

    // Hero Section
    hero: {
      title: 'Your Neighborhood Minimarket',
      subtitle: 'Fresh products, competitive prices, and fast delivery',
      description: 'We offer a wide variety of fresh products, groceries, and household items with delivery to your door.',
      shopNow: 'Shop Now',
      viewCategories: 'View Categories',
      freeDelivery: 'Free Delivery Available'
    },

    // Categories
    categories: {
      title: 'Shop by Category',
      subtitle: 'Find everything you need for your daily shopping',
      fresh: {
        name: 'Fresh Produce',
        description: 'Fruits, vegetables, and fresh products'
      },
      dairy: {
        name: 'Dairy & Eggs',
        description: 'Milk, cheese, yogurt, and eggs'
      },
      bakery: {
        name: 'Bakery',
        description: 'Fresh bread, pastries, and baked goods'
      },
      beverages: {
        name: 'Beverages',
        description: 'Sodas, juices, water, and drinks'
      },
      snacks: {
        name: 'Snacks',
        description: 'Chips, candies, and snack foods'
      },
      household: {
        name: 'Household',
        description: 'Cleaning products and household items'
      }
    },

    // Cart & Checkout
    cart: {
      title: 'Shopping Cart',
      empty: 'Your cart is empty',
      emptySubtitle: 'Add some products to get started',
      continueShopping: 'Continue Shopping',
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      tax: 'Tax',
      total: 'Total',
      checkout: 'Proceed to Checkout',
      remove: 'Remove',
      quantity: 'Quantity',
      addMore: 'Add More Items',
    },

    // Common UI Elements
    common: {
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Try Again',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      confirm: 'Confirm',
      close: 'Close',
      next: 'Next',
      previous: 'Previous',
      viewAll: 'View All',
      learnMore: 'Learn More',
      addToCart: 'Add to Cart',
      buyNow: 'Buy Now',
      viewDetails: 'View Details',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort by',
      price: 'Price',
      category: 'Category',
      brand: 'Brand',
      availability: 'Availability',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      onSale: 'On Sale',
      new: 'New',
      featured: 'Featured',
      bestseller: 'Bestseller',
      delivery: 'Free Delivery',
      support: '24/7 Support',
    },

    // Footer
    footer: {
      description: 'Your trusted neighborhood minimarket. Fresh products, competitive prices, and excellent service.',
      quickLinks: 'Quick Links',
      categories: 'Categories',
      customerService: 'Customer Service',
      aboutUs: 'About Us',
      contact: 'Contact',
      delivery: 'Delivery Info',
      returns: 'Returns',
      faq: 'FAQ',
      terms: 'Terms & Conditions',
      privacy: 'Privacy Policy',
      followUs: 'Follow Us',
      newsletter: 'Newsletter',
      subscribe: 'Subscribe',
      emailPlaceholder: 'Enter your email',
      copyright: 'All rights reserved.',
      designedBy: 'Designed by ΛRΛMΛC'
    },

    // SEO & Meta
    meta: {
      title: 'Minimarket | Fresh Products & Groceries Delivery',
      description: 'Fresh produce, groceries, and household items delivered to your door. Competitive prices and fast delivery service.',
      keywords: 'minimarket, groceries, fresh produce, delivery, food, household, chile, online shopping',
    },
  },

  es: {
    // Navigation & Global
    nav: {
      home: 'Inicio',
      products: 'Productos',
      categories: 'Categorías',
      cart: 'Carrito',
      checkout: 'Pagar',
      account: 'Cuenta',
      contact: 'Contacto',
      search: 'Buscar productos...',
      languageToggle: 'Cambiar idioma',
    },

    // Hero Section
    hero: {
      title: 'Tu Minimarket de Barrio',
      subtitle: 'Productos frescos, precios competitivos, y entrega rápida',
      description: 'Ofrecemos una amplia variedad de productos frescos, abarrotes y artículos del hogar con entrega a domicilio.',
      shopNow: 'Comprar Ahora',
      viewCategories: 'Ver Categorías',
      freeDelivery: 'Entrega Gratis Disponible'
    },

    // Categories
    categories: {
      title: 'Compra por Categoría',
      subtitle: 'Encuentra todo lo que necesitas para tus compras diarias',
      fresh: {
        name: 'Frutas y Verduras',
        description: 'Frutas, verduras y productos frescos'
      },
      dairy: {
        name: 'Lácteos y Huevos',
        description: 'Leche, queso, yogurt y huevos'
      },
      bakery: {
        name: 'Panadería',
        description: 'Pan fresco, pasteles y productos horneados'
      },
      beverages: {
        name: 'Bebidas',
        description: 'Gaseosas, jugos, agua y bebidas'
      },
      snacks: {
        name: 'Snacks',
        description: 'Papas fritas, dulces y alimentos ligeros'
      },
      household: {
        name: 'Hogar',
        description: 'Productos de limpieza y artículos del hogar'
      }
    },

    // Cart & Checkout
    cart: {
      title: 'Carrito de Compras',
      empty: 'Tu carrito está vacío',
      emptySubtitle: 'Agregá algunos productos para comenzar',
      continueShopping: 'Seguir Comprando',
      subtotal: 'Subtotal',
      delivery: 'Entrega',
      tax: 'Impuestos',
      total: 'Total',
      checkout: 'Proceder al Pago',
      remove: 'Eliminar',
      quantity: 'Cantidad',
      addMore: 'Agregar Más Artículos',
    },

    // Common UI Elements
    common: {
      loading: 'Cargando...',
      error: 'Algo salió mal',
      retry: 'Intentar de Nuevo',
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Eliminar',
      confirm: 'Confirmar',
      close: 'Cerrar',
      next: 'Siguiente',
      previous: 'Anterior',
      viewAll: 'Ver Todo',
      learnMore: 'Saber Más',
      addToCart: 'Agregar al Carrito',
      buyNow: 'Comprar Ahora',
      viewDetails: 'Ver Detalles',
      search: 'Buscar',
      filter: 'Filtrar',
      sort: 'Ordenar por',
      price: 'Precio',
      category: 'Categoría',
      brand: 'Marca',
      availability: 'Disponibilidad',
      inStock: 'En Stock',
      outOfStock: 'Sin Stock',
      onSale: 'En Oferta',
      new: 'Nuevo',
      featured: 'Destacado',
      bestseller: 'Más Vendido',
      delivery: 'Entrega Gratis',
      support: 'Soporte 24/7',
    },

    // Footer
    footer: {
      description: 'Tu minimarket de barrio de confianza. Productos frescos, precios competitivos y excelente servicio.',
      quickLinks: 'Enlaces Rápidos',
      categories: 'Categorías',
      customerService: 'Servicio al Cliente',
      aboutUs: 'Sobre Nosotros',
      contact: 'Contacto',
      delivery: 'Información de Entrega',
      returns: 'Devoluciones',
      faq: 'Preguntas Frecuentes',
      terms: 'Términos y Condiciones',
      privacy: 'Política de Privacidad',
      followUs: 'Síguenos',
      newsletter: 'Newsletter',
      subscribe: 'Suscribirse',
      emailPlaceholder: 'Ingresa tu email',
      copyright: 'Todos los derechos reservados.',
      designedBy: 'Diseñado por ΛRΛMΛC'
    },

    // SEO & Meta
    meta: {
      title: 'Minimarket | Productos Frescos y Entrega de Abarrotes',
      description: 'Frutas y verduras frescas, abarrotes y artículos del hogar entregados a tu puerta. Precios competitivos y servicio de entrega rápido.',
      keywords: 'minimarket, abarrotes, frutas verduras, entrega, comida, hogar, chile, compras online',
    },
  },
} satisfies Record<Locale, { [key: string]: TranslationValue }>

// i18n Context
interface I18nContextType {
  locale: Locale
  t: (key: string, options?: { defaultValue?: string }) => string
  changeLocale: (newLocale: Locale) => void
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Provider component that manages locale state
export function I18nProviderClient({ children, locale: initialLocale }: { children: React.ReactNode, locale: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  // Update locale when initialLocale changes (for SSR/hydration)
  useEffect(() => {
    setLocale(initialLocale)
  }, [initialLocale])

  const t = (key: string, options?: { defaultValue?: string }): string => {
    const keys = key.split('.')
    let value: TranslationValue = translations[locale]

    for (const k of keys) {
      value = (value as { [key: string]: TranslationValue })?.[k]
    }

    // Always return a string for React components
    if (typeof value === 'string') {
      return value
    }
    return options?.defaultValue || key
  }

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    // Set cookie for persistence
    document.cookie = `aramac-minimarket-locale=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}`
  }

  return (
    <I18nContext.Provider value={{ locale, t, changeLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

// Hook to use current locale
export function useCurrentLocale(): Locale {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useCurrentLocale must be used within I18nProviderClient')
  }
  return context.locale
}

// Hook to get translation function
export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProviderClient')
  }
  return context.t
}

// Hook to change locale
export function useChangeLocale() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useChangeLocale must be used within I18nProviderClient')
  }
  return context.changeLocale
}

// Scoped i18n (same as useI18n for now)
export const useScopedI18n = useI18n

// Get direction for locale (for RTL support if needed)
export function getDirection(_locale: Locale): 'ltr' | 'rtl' {
  return 'ltr' // All supported locales are LTR
}

// Format currency based on locale
export function formatCurrency(amount: number, locale: Locale): string {
  if (locale === 'es') {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Format date based on locale
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-CL' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}