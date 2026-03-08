import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Par défaut, on renvoie vers le profil en français
  const next = searchParams.get('next') ?? '/fr/profile'

  if (code) {
    // ✅ Correction ESLint : On utilise 'const' car la variable n'est jamais réassignée
    const response = NextResponse.redirect(new URL(next, origin))

    // On configure le client Supabase Server
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { 
            return request.cookies.getAll() 
          },
          setAll(cookiesToSet) {
            // On accroche les cookies directement à la réponse constante
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Échange du code temporaire contre une session persistante
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Succès : on renvoie la redirection AVEC les cookies de session attachés
      return response
    } else {
      console.error("Erreur Auth Callback:", error.message)
    }
  }

  // Redirection de secours si l'auth échoue ou s'il n'y a pas de code
  return NextResponse.redirect(new URL('/fr/login?error=auth_callback_failed', origin))
}