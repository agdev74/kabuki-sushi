/**
 * /api/notifications/whatsapp
 *
 * Route de notification WhatsApp non-bloquante.
 * Utilise le SDK Twilio via @/lib/twilio.
 *
 * Événements supportés :
 *   "new_order"       — Nouvelle commande (toute, après paiement validé)
 *   "new_delivery"    — Nouvelle livraison (déclenchée depuis la cuisine admin)
 *   "order_ready"     — Commande marquée "Prête à être livrée"
 *   "order_cancelled" — Commande annulée
 *   "emergency_open"  — Fermeture d'urgence activée
 *   "emergency_close" — Fermeture d'urgence levée
 */

import { NextResponse } from "next/server";
import { sendWhatsAppAlert } from "@/lib/twilio";

export type WhatsAppEvent =
  | "new_order"
  | "new_delivery"
  | "order_ready"
  | "order_cancelled"
  | "emergency_open"
  | "emergency_close";

interface WhatsAppPayload {
  event: WhatsAppEvent;
  // Champs commandes
  orderId?: number;
  customerName?: string;
  orderType?: string;
  deliveryAddress?: string;
  // Champs new_order uniquement
  items?: string[];      // ex: ["2× Sashimi Saumon", "1× Gyoza"]
  totalCHF?: number;
  pickupTime?: string;
  // Champs emergency_* uniquement
  emergencyUntil?: string;  // ISO string
}

// ─── Construction des messages ────────────────────────────────────────────────

function buildMessage(payload: WhatsAppPayload): string {
  const { event, orderId, customerName = "Client", orderType, deliveryAddress } = payload;

  switch (event) {

    case "new_order": {
      const isDelivery = orderType === "Livraison";
      const itemLines = (payload.items ?? []).map(i => `• ${i}`).join("\n");
      return (
        `🍣 *Nouvelle Commande — Kabuki* #KBK-${orderId}\n` +
        `👤 ${customerName}\n` +
        (isDelivery ? `🛵 Livraison\n📍 ${deliveryAddress ?? "adresse non renseignée"}\n` : `🏠 À emporter\n`) +
        (itemLines ? `\n📋 *Contenu :*\n${itemLines}\n` : "") +
        `\n💰 Total : ${(payload.totalCHF ?? 0).toFixed(2)} CHF` +
        (payload.pickupTime ? `\n⏱ Prévu pour : ${payload.pickupTime}` : "") +
        `\n⚡ À prendre en charge !`
      );
    }

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

    case "emergency_open": {
      const until = payload.emergencyUntil
        ? new Intl.DateTimeFormat("fr-CH", {
            timeZone: "Europe/Zurich",
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(payload.emergencyUntil))
        : "fin du service";
      return (
        `🚨 *FERMETURE D'URGENCE — Kabuki*\n` +
        `⏱ Active jusqu'à : ${until}\n` +
        `⚠️ Commandes en ligne suspendues.`
      );
    }

    case "emergency_close":
      return (
        `✅ *Restaurant ROUVERT — Kabuki*\n` +
        `🎉 Fermeture d'urgence levée manuellement.`
      );
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

const VALID_EVENTS: WhatsAppEvent[] = [
  "new_order", "new_delivery", "order_ready", "order_cancelled",
  "emergency_open", "emergency_close",
];

export async function POST(req: Request): Promise<Response> {
  let payload: WhatsAppPayload;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!payload.event || !VALID_EVENTS.includes(payload.event)) {
    return NextResponse.json({ error: "Événement invalide" }, { status: 400 });
  }

  const message = buildMessage(payload);

  // Fire-and-forget — on répond immédiatement, l'envoi s'effectue en arrière-plan.
  sendWhatsAppAlert(message).catch((err) =>
    console.error("[whatsapp] Erreur envoi :", err),
  );

  return NextResponse.json({ ok: true });
}
