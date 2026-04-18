/**
 * /api/notifications/whatsapp
 *
 * Route de notification WhatsApp non-bloquante (Règle Sécurité #2).
 * Squelette prêt pour Twilio (défaut) ou Meta Cloud API.
 *
 * Variables d'environnement requises pour activer les envois réels :
 *   TWILIO_ACCOUNT_SID    — SID du compte Twilio
 *   TWILIO_AUTH_TOKEN     — Token d'auth Twilio
 *   TWILIO_WHATSAPP_FROM  — Numéro Twilio WhatsApp (ex: whatsapp:+14155238886)
 *
 * Événements supportés :
 *   "new_delivery"    — Nouvelle commande Livraison (après paiement confirmé)
 *   "order_ready"     — Commande marquée "Prête à être livrée"
 *   "order_cancelled" — Commande annulée
 */

import { NextResponse } from "next/server";

// Numéro admin Kabuki Sushi (Règle Sécurité #3 : format E.164 strict)
const ADMIN_PHONE = "+41786767100";

export type WhatsAppEvent = "new_delivery" | "order_ready" | "order_cancelled";

interface WhatsAppPayload {
  event: WhatsAppEvent;
  orderId: number;
  customerName?: string;
  orderType?: string;
  deliveryAddress?: string;
}

// ─── Construction du message ──────────────────────────────────────────────────

function buildMessage(payload: WhatsAppPayload): string {
  const { event, orderId, customerName = "Client", deliveryAddress } = payload;
  switch (event) {
    case "new_delivery":
      return (
        `🍣 *Nouvelle LIVRAISON — Kabuki* #KBK-${orderId}\n` +
        `👤 Client : ${customerName}\n` +
        (deliveryAddress ? `📍 Adresse : ${deliveryAddress}\n` : "") +
        `⚡ À prendre en charge dès que possible.`
      );
    case "order_ready":
      return (
        `✅ *Commande Prête* — Kabuki #KBK-${orderId}\n` +
        `👤 ${customerName}\n` +
        `🛵 Le livreur peut partir.`
      );
    case "order_cancelled":
      return (
        `❌ *Commande Annulée* — Kabuki #KBK-${orderId}\n` +
        `👤 ${customerName}`
      );
  }
}

// ─── Envoi via Twilio WhatsApp ────────────────────────────────────────────────

async function sendViaTwilio(message: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    // Twilio non configuré : log de simulation pour le développement
    console.info(`[whatsapp/twilio] Non configuré — message simulé :\n${message}`);
    return;
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        From: from,
        To: `whatsapp:${ADMIN_PHONE}`,
        Body: message,
      }).toString(),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Twilio HTTP ${res.status}: ${body}`);
  }
}

/*
 * ─── Alternative : Meta Cloud API ──────────────────────────────────────────
 * Pour basculer sur l'API officielle Meta, remplacez sendViaTwilio() par :
 *
 * async function sendViaMeta(message: string): Promise<void> {
 *   const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
 *   const token = process.env.META_WHATSAPP_TOKEN;
 *   if (!phoneNumberId || !token) {
 *     console.info("[whatsapp/meta] Non configuré — message simulé :", message);
 *     return;
 *   }
 *   await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
 *     method: "POST",
 *     headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
 *     body: JSON.stringify({
 *       messaging_product: "whatsapp",
 *       to: ADMIN_PHONE,
 *       type: "text",
 *       text: { body: message },
 *     }),
 *   });
 * }
 */

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  let payload: WhatsAppPayload;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const VALID_EVENTS: WhatsAppEvent[] = ["new_delivery", "order_ready", "order_cancelled"];
  if (!payload.event || !VALID_EVENTS.includes(payload.event) || !payload.orderId) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const message = buildMessage(payload);

  // Règle Sécurité #2 : fire-and-forget — on répond immédiatement au client,
  // l'envoi WhatsApp s'effectue en arrière-plan sans bloquer la réponse.
  sendViaTwilio(message).catch((err) =>
    console.error("[whatsapp] Erreur envoi :", err),
  );

  return NextResponse.json({ ok: true });
}
