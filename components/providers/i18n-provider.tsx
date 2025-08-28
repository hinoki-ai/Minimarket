'use client'

import { I18nProviderClient } from '@/lib/i18n'
import { type Locale } from '@/lib/i18n'

interface I18nProviderProps {
  locale: Locale
  children: React.ReactNode
}

export function I18nProvider({ locale, children }: I18nProviderProps) {
  return (
    <I18nProviderClient locale={locale}>
      {children}
    </I18nProviderClient>
  )
}