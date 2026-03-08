import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const locales = ['fr', 'en', 'es']
const defaultLocale = 'fr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. EXCLUSIONS (Fichiers, API, et surtout la route de déconnexion/callback)
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/auth') || 
    pathname.includes('.') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next()
  }

  // 2. INITIALISATION SUPABASE (SANS REDIRECTION IMMÉDIATE)
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // On rafraîchit la session mais on ne bloque pas si elle échoue
  const { data: { user } } = await supabase.auth.getUser()

  // 3. LOGIQUE DE LANGUES
  const segments = pathname.split('/')
  const langInUrl = locales.find(l => segments[1] === l)

  if (!langInUrl && pathname !== '/login') {
    const newUrl = new URL(`/${defaultLocale}${pathname === '/' ? '' : pathname}`, request.url)
    const redirectResponse = NextResponse.redirect(newUrl)
    // On transfère les cookies de session vers la redirection pour ne pas perdre l'auth
    request.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value))
    return redirectResponse
  }

  // 4. PROTECTION ADMIN (Sécurité supplémentaire côté serveur)
  if (pathname.includes('/admin') && !user) {
    return NextResponse.redirect(new URL(`/${langInUrl || defaultLocale}/login`, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|auth).*)'],
}