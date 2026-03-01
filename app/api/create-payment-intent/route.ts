import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/utils/supabase";

// ✅ 1. Correction du typage de Stripe pour supprimer le "as any"
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27-preview" as Stripe.LatestApiVersion,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, orderId, couponCode } = body;

    // 1. Validation de base
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    if (!orderId) {
      return NextResponse.json({ error: "ID de commande manquant" }, { status: 400 });
    }

    let finalAmount = amount;
    let discountApplied = 0;

    // 2. Validation du Coupon côté SERVEUR
    if (couponCode) {
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", (couponCode as string).toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (!couponError && coupon) {
        const now = new Date();
        const isExpired = coupon.expiration_date && new Date(coupon.expiration_date) < now;

        if (!isExpired && amount >= coupon.min_order_amount) {
          if (coupon.discount_type === "percentage") {
            discountApplied = (amount * coupon.discount_value) / 100;
          } else {
            discountApplied = coupon.discount_value;
          }
          finalAmount = Math.max(0, amount - discountApplied);
        }
      }
    }

    const amountInCents = Math.round(finalAmount * 100);

    // 3. Création du PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "chf",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: (orderId as number | string).toString(),
        couponUsed: (couponCode as string) || "none",
        discountAmount: discountApplied.toFixed(2),
      },
    });

    // 4. Mise à jour de la commande dans Supabase
    await supabase
      .from("orders")
      .update({ 
        total_amount: finalAmount,
        discount_amount: discountApplied,
        coupon_code: (couponCode as string) || null
      })
      .eq("id", orderId);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    // ✅ Correction du typage de l'erreur dans le catch
    const err = error as Error;
    console.error("❌ Erreur API Stripe:", err.message);
    
    return NextResponse.json(
      { error: "Impossible d'initialiser le paiement sécurisé." },
      { status: 500 }
    );
  }
}