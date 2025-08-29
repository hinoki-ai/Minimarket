import { cookies } from 'next/headers'
import { locales, type Locale } from './i18n'

// Get locale from request with error handling for deployment environments
export async function getLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies()
    const locale = cookieStore.get('aramac-minimarket-locale')?.value as Locale

    return locale && locales.includes(locale) ? locale : 'es' // Default to Spanish for Chilean minimarket
  } catch (error) {
    // Fallback for edge cases during deployment or SSR
    console.warn('Failed to get locale from cookies, falling back to default:', error)
    return 'es'
  }
}