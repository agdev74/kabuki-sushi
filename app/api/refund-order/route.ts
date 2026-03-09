import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

// 1. Initialisation de Stripe sans conflit de linter
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: "2026-02-25.clover" as any, 
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 🛡️ SÉCURITÉ #7 - Authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    // 🛡️ SÉCURITÉ #7 - Autorisation (Admin uniquement)
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "Accès refusé : Droits administrateur requis" }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "ID de commande manquant" }, { status: 400 });
    }

    // 2. Recherche du paiement via metadata Stripe
    const searchResults = await stripe.paymentIntents.search({
      query: `metadata['orderId']:'${orderId}'`,
    });

    if (searchResults.data.length === 0) {
      return NextResponse.json({ error: "Paiement introuvable sur Stripe." }, { status: 404 });
    }

    const paymentIntent = searchResults.data[0];

    // 3. Validation : Statut du paiement
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ 
        error: `Remboursement impossible (Statut : ${paymentIntent.status})` 
      }, { status: 400 });
    }

    // 4. Exécution du remboursement
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent.id,
    });

    return NextResponse.json({ success: true, refund });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("❌ Erreur Stripe Refund:", errorMessage);
    
    return NextResponse.json(
      { error: "Une erreur est survenue lors du remboursement." },
      { status: 500 }
    );
  }
}