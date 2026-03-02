import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

// ✅ Client service_role — bypass RLS pour les opérations serveur
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // On reçoit TOUTES les infos nécessaires pour créer la commande
    const { 
        amount, // Le total brut calculé par le front (pourrait être sécurisé davantage en recalculant via les items)
        couponCode, items, customerName, customerPhone, 
        pickupDate, pickupTime, orderType, deliveryAddress, deliveryZip, comments 
    } = body;

    let finalAmount = amount;
    let discountApplied = 0;

    // --- 1. LOGIQUE DE COUPON CÔTÉ SERVEUR ---
    if (couponCode) {
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", (couponCode as string).toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (!couponError && coupon) {
        const now = new Date();
        const isExpired = coupon.expiration_date && new Date(coupon.expiration_date) < now;

        if (!isExpired && amount >= (coupon.min_order_amount || 0)) {
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

    if (amountInCents < 50) {
      return NextResponse.json({ error: "Montant trop faible" }, { status: 400 });
    }

    // --- 2. CRÉATION DE LA COMMANDE DANS SUPABASE ---
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        customer_name: customerName, 
        customer_phone: customerPhone, 
        pickup_date: pickupDate,
        pickup_time: pickupTime, 
        order_type: orderType, 
        delivery_address: deliveryAddress, 
        delivery_zip: deliveryZip, 
        total_amount: finalAmount, 
        discount_amount: discountApplied, 
        coupon_code: couponCode || null, 
        items: items, 
        status: "Paiement en cours",
        comments: comments 
      }])
      .select('id')
      .single();

    if (orderError || !orderData) {
      console.error("❌ Erreur Supabase INSERT order:", orderError?.message);
      return NextResponse.json({ error: "Erreur création commande" }, { status: 500 });
    }

    const newOrderId = orderData.id;

    // --- 3. CRÉATION DU PAYMENT INTENT STRIPE ---
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "chf",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: String(newOrderId),
        couponUsed: (couponCode as string) || "none",
        discountAmount: discountApplied.toFixed(2),
        originalAmount: amount.toFixed(2),
      },
    });

    // On renvoie le secret ET le nouvel ID de commande
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: newOrderId
    });

  } catch (error) {
    console.error("❌ Erreur API Stripe/Supabase:", (error as Error).message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}