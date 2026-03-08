import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. EXCLUSIONS : On ne touche pas aux fichiers statiques ni à l'auth interne
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/auth') || 
    pathname.includes('.') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next()
  }

  // 2. INITIALISATION : On crée la réponse de base
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

  // On rafraîchit la session (essentiel pour les cookies)
  await supabase.auth.getUser()

  // 3. LOGIQUE i18n : Redirection vers la langue par défaut si manquante
  const locales = ['fr', 'en', 'es']
  const langInUrl = locales.find(l => pathname.startsWith(`/${l}`))

  if (!langInUrl && pathname !== '/login') {
    const redirectUrl = new URL(`/fr${pathname === '/' ? '' : pathname}`, request.url)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    
    // ✅ TRANSFERT CRUCIAL : On récupère les headers Set-Cookie de la réponse Supabase
    // et on les injecte manuellement dans la redirection pour éviter la boucle Google.
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