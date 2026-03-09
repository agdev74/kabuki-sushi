/**
 * 🔒 WEBHOOK STRIPE SÉCURISÉ — kabuki-sushi.ch
 */

import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';


// ─── Clients ──────────────────────────────────────────────────────────────────

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ─── Idempotence (Anti-Replay) ─────────────────────────────────────────────────

async function isAlreadyProcessed(eventId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('processed_webhook_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .maybeSingle();

  if (error) {
    console.error('[webhook] Erreur lecture idempotence:', error.message);
    return true;
  }
  return !!data;
}

async function markAsProcessed(
  eventId: string,
  eventType: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('processed_webhook_events')
    .insert({
      stripe_event_id: eventId,
      event_type: eventType,
      processed_at: new Date().toISOString(),
    });

  if (error) {
    if (error.code === '23505') {
      console.warn(`[webhook] Double traitement détecté pour ${eventId}, ignoré`);
    } else {
      console.error('[webhook] Erreur marquage idempotence:', error.message);
    }
  }
}

// ─── Handlers par type d'événement ───────────────────────────────────────────

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  // ✅ CORRECTIF SÉCURITÉ #5 : Vérification du paiement réel
  if (session.payment_status !== 'paid') {
    console.info(
      `[webhook] Session ${session.id} terminée mais payment_status=${session.payment_status}, skip.`
    );
    return;
  }

  const cartMetadata = session.metadata?.cart;

  if (!cartMetadata) {
    console.error('[webhook] Metadata cart manquante dans la session:', session.id);
    return;
  }

  let cart: Array<{ menuItemId: string; quantity: number }>;
  try {
    cart = JSON.parse(cartMetadata);
  } catch {
    console.error('[webhook] Metadata cart invalide (JSON malformé):', cartMetadata);
    return;
  }

  // ✅ CORRECTIF SÉCURITÉ #6 : Validation des Quantités et du Panier
  const MAX_ITEM_QUANTITY = 50;
  const MAX_CART_LINES = 30;

  const isCartValid = 
    Array.isArray(cart) && 
    cart.length > 0 && 
    cart.length <= MAX_CART_LINES &&
    cart.every(item => 
      typeof item.menuItemId === 'string' &&
      item.menuItemId.length > 0 &&
      Number.isInteger(item.quantity) &&
      item.quantity >= 1 &&
      item.quantity <= MAX_ITEM_QUANTITY
    );

  if (!isCartValid) {
    console.error('[webhook] ❌ Panier invalide ou hors limites détecté:', cart);
    return;
  }

  const menuItemIds = cart.map((i) => i.menuItemId);
  const { data: menuItems, error: menuError } = await supabaseAdmin
    .from('menu_items')
    .select('id, name, price_cents')
    .in('id', menuItemIds);

  if (menuError || !menuItems) {
    console.error('[webhook] Impossible de récupérer les prix:', menuError?.message);
    return;
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      user_id: session.metadata?.userId ?? null,
      customer_email: session.customer_details?.email ?? null,
      status: 'paid',
      total_cents: session.amount_total ?? 0,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('[webhook] Erreur création commande:', orderError?.message);
    return;
  }

  const orderItems = cart.map((cartItem) => {
    const menuItem = menuItems.find((m) => m.id === cartItem.menuItemId);
    return {
      order_id: order.id,
      menu_item_id: cartItem.menuItemId,
      quantity: cartItem.quantity,
      unit_price_cents: menuItem?.price_cents ?? 0,
      name_snapshot: menuItem?.name ?? 'Article inconnu',
    };
  });

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('[webhook] Erreur création order_items:', itemsError.message);
    return;
  }

  console.info(`[webhook] ✅ Commande ${order.id} créée pour session ${session.id}`);
}

async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'payment_failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('[webhook] Erreur mise à jour statut paiement échoué:', error.message);
  } else {
    console.info(`[webhook] ⚠️ Paiement échoué pour PaymentIntent ${paymentIntent.id}`);
  }
}

async function handleRefundCreated(charge: Stripe.Charge): Promise<void> {
  if (!charge.payment_intent) return;

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'refunded' })
    .eq('stripe_payment_intent_id', charge.payment_intent as string);

  if (error) {
    console.error('[webhook] Erreur mise à jour statut remboursement:', error.message);
  } else {
    console.info(`[webhook] 💸 Remboursement enregistré pour ${charge.payment_intent}`);
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  const rawBody = await req.text();
  const headersList = await headers();
  const stripeSignature = headersList.get('stripe-signature');

  if (!stripeSignature) {
    console.warn('[webhook] Requête reçue sans header stripe-signature');
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      stripeSignature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[webhook] ❌ Signature invalide:', err instanceof Error ? err.message : err);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  const eventAgeSeconds = Math.floor(Date.now() / 1000) - event.created;
  const MAX_EVENT_AGE_SECONDS = 600;

  if (eventAgeSeconds > MAX_EVENT_AGE_SECONDS) {
    console.warn(
      `[webhook] Événement trop ancien: ${eventAgeSeconds}s (max ${MAX_EVENT_AGE_SECONDS}s) — ID: ${event.id}`
    );
    return new Response('Event timestamp too old', { status: 400 });
  }

  if (await isAlreadyProcessed(event.id)) {
    console.info(`[webhook] Événement ${event.id} déjà traité, skip`);
    return new Response('Already processed', { status: 200 });
  }

  console.info(`[webhook] Traitement de l'événement: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefundCreated(event.data.object as Stripe.Charge);
        break;

      default:
        console.info(`[webhook] Événement non géré: ${event.type}`);
    }
  } catch (err) {
    console.error(`[webhook] Erreur non gérée pour ${event.type}:`, err);
    return new Response('Internal processing error', { status: 500 });
  }

  await markAsProcessed(event.id, event.type);

  return new Response('OK', { status: 200 });
}