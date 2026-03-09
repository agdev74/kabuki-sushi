import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // ✅ SÉCURITÉ #7 : Vérification d'identité stricte côté serveur
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: profile, error: dbError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // PGRST116 est l'erreur "aucune ligne trouvée", on ne veut pas qu'elle fasse crash l'API
    if (dbError && dbError.code !== 'PGRST116') throw dbError;

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[API] get-profile error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}