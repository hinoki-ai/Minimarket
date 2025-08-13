'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center px-6">
      <h1 className="text-3xl md:text-4xl font-semibold text-center">Ha ocurrido un error</h1>
      <p className="text-muted-foreground mt-3 text-center max-w-prose">Por favor intenta nuevamente. Si el problema persiste, vuelve al inicio.</p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="px-4 py-2 rounded-md bg-primary text-primary-foreground subtle-hover">Reintentar</button>
        <Link href="/" className="px-4 py-2 rounded-md border subtle-hover">Ir al inicio</Link>
      </div>
    </section>
  )
}

