import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. EXCLUSIONS
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/auth') || 
    pathname.includes('.') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next()
  }

  // 2. INITIALISATION SUPABASE
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

  // ✅ On appelle getUser() pour rafraîchir la session et mettre à jour les headers 'Set-Cookie'
  // Mais on n'assigne plus le résultat à une variable inutilisée
  await supabase.auth.getUser()

  // 3. LOGIQUE DE LANGUES (i18n)
  const locales = ['fr', 'en', 'es']
  const segments = pathname.split('/')
  const langInUrl = locales.find(l => segments[1] === l)

  if (!langInUrl && pathname !== '/login') {
    const redirectUrl = new URL(`/fr${pathname === '/' ? '' : pathname}`, request.url)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    
    // ✅ TRANSFERT RIGOUREUX DES HEADERS : Empêche la perte de session lors de la redirection
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      redirectResponse.headers.set('set-cookie', setCookie)
    }
    
    return redirectResponse
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|auth).*)'],
}