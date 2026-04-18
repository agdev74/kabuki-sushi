/**
 * Utilitaire serveur — envoi de messages WhatsApp via Twilio.
 *
 * Variables d'environnement :
 *   TWILIO_ACCOUNT_SID    — SID du compte Twilio
 *   TWILIO_AUTH_TOKEN     — Token d'authentification Twilio
 *   TWILIO_FROM_NUMBER    — Numéro expéditeur (ex: whatsapp:+14155238886)
 *   OWNER_PHONE_NUMBER    — Numéro destinataire (ex: whatsapp:+41786767100)
 *
 * Si TWILIO_ACCOUNT_SID ou TWILIO_AUTH_TOKEN sont absents (mode dev local),
 * la fonction simule l'envoi dans la console sans lever d'erreur.
 */

import twilio from "twilio";

/** Normalise un numéro en ajoutant le préfixe whatsapp: si absent. */
function toWhatsApp(raw: string): string {
  return raw.startsWith("whatsapp:") ? raw : `whatsapp:${raw}`;
}

export async function sendWhatsAppAlert(message: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;

  // Variables manquantes → simulation (dev local, tests)
  if (!accountSid || !authToken) {
    console.info("[twilio] Non configuré — message simulé :\n" + message);
    return;
  }

  const from = toWhatsApp(
    process.env.TWILIO_FROM_NUMBER ??
    process.env.TWILIO_WHATSAPP_FROM ??   // backward compat
    "+14155238886"
  );

  const to = toWhatsApp(
    process.env.OWNER_PHONE_NUMBER ?? "+41786767100"
  );

  const client = twilio(accountSid, authToken);
  await client.messages.create({ from, to, body: message });
}
