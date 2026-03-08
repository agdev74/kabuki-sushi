import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Par défaut, on renvoie vers le profil en français
  const next = searchParams.get('next') ?? '/fr/profile'

  if (code) {
    // 1. On utilise l'API native de Next.js pour gérer les cookies (100% fiable sur Vercel)
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              // Ignoré de manière sécurisée si appelé depuis un Server Component
            }
          },
        },
      }
    )

    // 2. Échange du code temporaire contre une session persistante
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 3. 🚨 LE FIX VERCEL CRUCIAL : Forcer le vrai nom de domaine
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        // En local (localhost)
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        // Sur Vercel : On utilise le host forwardé (www.kabuki-sushi.ch) pour ancrer les cookies
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        // Fallback générique
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      console.error("Erreur d'échange Supabase :", error.message)
    }
  }

  // Redirection de secours propre
  return NextResponse.redirect(`${origin}/fr/login?error=auth_callback_failed`)
}