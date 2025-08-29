'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <section className="min-h-[60vh] flex flex-col items-center justify-center px-6">
          <h1 className="text-3xl md:text-4xl font-semibold text-center">Ocurrió un error inesperado</h1>
          <p className="text-muted-foreground mt-3 text-center max-w-prose">Estamos trabajando para solucionarlo.</p>
          <button onClick={reset} className="mt-6 px-4 py-2 rounded-md bg-primary text-primary-foreground subtle-hover">Reintentar</button>
        </section>
      </body>
    </html>
  )
}

