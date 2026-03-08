import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log("--- AUTH CALLBACK START ---")
  console.log("Code présent :", !!code)

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log("Authentification réussie pour :", data.user?.email)
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error("Erreur d'échange de session :", error.message)
  }

  console.log("--- AUTH CALLBACK FAILED OR NO CODE ---")
  // En cas d'échec, on redirige avec un paramètre d'erreur pour le voir dans l'URL
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`)
}