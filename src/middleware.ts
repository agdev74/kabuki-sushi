// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const locales = ['fr', 'en', 'es']
const defaultLocale = 'fr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request: { headers: request.headers } })

  // 1. SKIP (Images, API, fichiers statiques)
  if (pathname.startsWith('/_next') || pathname.includes('.') || pathname.startsWith('/api')) {
    return response
  }

  // 2. ANALYSE DU CHEMIN
  const segments = pathname.split('/')
  const langInUrl = locales.find(l => segments[1] === l)
  
  // 🚩 ACTION : Si la langue manque (ex: /admin/menu)
  if (!langInUrl && pathname !== '/login') {
    // On construit la nouvelle URL avec le /fr/ devant
    const newUrl = new URL(`/${defaultLocale}${pathname === '/' ? '' : pathname}`, request.url)
    console.log(`🔄 Redirection auto : ${pathname} -> ${newUrl.pathname}`)
    return NextResponse.redirect(newUrl)
  }

  // Si on arrive ici, on a forcément une langue (soit déjà là, soit on vient de rediriger)
  const currentLang = langInUrl || defaultLocale

  // 3. PROTECTION ADMIN
  if (pathname.includes('/admin')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return request.cookies.get(name)?.value },
          set(name, value, options) {
            request.cookies.set({ name, value, ...options })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value, ...options })
          },
          remove(name, options) {
            request.cookies.set({ name, value: '', ...options })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Redirection vers le login localisé
      return NextResponse.redirect(new URL(`/${currentLang}/login`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api).*)'],
}