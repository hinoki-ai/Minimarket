import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/carrito(.*)'])


export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()

  // Force HTTPS in production behind proxies/CDN
  const request = req as NextRequest
  const isSecure =
    request.headers.get('x-forwarded-proto') === 'https' ||
    request.nextUrl.protocol === 'https:'

  if (process.env.NODE_ENV === 'production' && !isSecure) {
    const url = new URL(request.url)
    url.protocol = 'https:'
    return Response.redirect(url, 308)
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}