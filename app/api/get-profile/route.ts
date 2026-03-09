import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    // 1. Initialisation du client
    const supabase = await createClient();
    
    // 2. Récupération de l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Si pas de session, on ne crash pas, on renvoie simplement null
    if (authError || !user) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    // 3. Récupération du profil (On reste sur l'essentiel pour éviter les colonnes inexistantes)
    const { data: profile, error: dbError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, loyalty_points, wallet_balance")
      .eq("id", user.id)
      .maybeSingle(); 

    if (dbError) {
      console.error("❌ [DB_ERROR] get-profile:", dbError.message);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ profile });

  } catch (error: unknown) {
    // ✅ ESLint fix : on remplace 'any' par 'unknown' et on vérifie le type
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    console.error("🔥 [CRITICAL_500] Crash route get-profile:", errorMessage);
    
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        message: errorMessage // Aide au debug en prod
      }, 
      { status: 500 }
    );
  }
}