'use client'

import * as React from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter, usePathname } from 'next/navigation'
import { locales, type Locale, useI18n, useCurrentLocale, useChangeLocale } from '@/lib/i18n'

const languageNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
}

const languageFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇨🇱',
}

interface LanguageToggleProps {}

export function LanguageToggle({}: LanguageToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useI18n()
  const currentLocale = useCurrentLocale()
  const changeLocale = useChangeLocale()

  const handleLanguageChange = (newLocale: Locale) => {
    // Use the changeLocale hook which handles both state and cookie
    changeLocale(newLocale)

    // Navigate to the new locale path
    const segments = pathname.split('/')

    // Remove current locale if present (segments[1] is the locale)
    if (locales.includes(segments[1] as Locale)) {
      segments.splice(1, 1)
    }

    // Add new locale
    const newPath = `/${newLocale}${segments.join('/') || '/'}`
    router.push(newPath)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 px-0 hover:bg-accent"
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('nav.languageToggle', { defaultValue: 'Toggle language' })}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLanguageChange(locale)}
            className={`cursor-pointer ${
              currentLocale === locale
                ? 'bg-accent text-accent-foreground font-medium'
                : 'hover:bg-accent/50'
            }`}
          >
            <span className="mr-2">{languageFlags[locale]}</span>
            {languageNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}