import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/auth') || 
    pathname.includes('.') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

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

  // Indispensable pour rafraîchir le jeton avant la redirection i18n
  await supabase.auth.getUser()

  const locales = ['fr', 'en', 'es']
  const langInUrl = locales.find(l => pathname.startsWith(`/${l}`))

  if (!langInUrl && pathname !== '/login') {
    const redirectUrl = new URL(`/fr${pathname === '/' ? '' : pathname}`, request.url)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    
    // ✅ SYNCHRONISATION TOTALE DES COOKIES (Corrigé pour TypeScript)
    // On passe directement l'objet cookie complet. Zéro erreur TS.
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    
    return redirectResponse
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|auth).*)'],
}