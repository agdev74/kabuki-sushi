/**
 * storeHours.ts — Logique d'ouverture du restaurant Kabuki Sushi Genève
 *
 * Règle de Sécurité #1 : Toutes les comparaisons d'heure utilisent l'API Intl.DateTimeFormat
 * native (équivalent à date-fns-tz) pour convertir l'UTC Vercel en heure Europe/Zurich.
 *
 * Horaires :
 *   Lundi     : Fermé
 *   Mar–Jeu   : 11h00–14h00 et 18h00–22h00
 *   Vendredi  : 11h00–14h00 et 18h00–02h00 (samedi matin)
 *   Samedi    : 18h00–02h00 (dimanche matin)
 *   Dimanche  : 18h00–22h30
 */

const TIMEZONE = "Europe/Zurich";

export type ClosureReason = "emergency" | "monday" | "outside_hours";

export interface StoreStatus {
  isOpen: boolean;
  reason?: ClosureReason;
  /** ISO string de réouverture en cas d'urgence */
  emergencyClosedUntil?: string | null;
}

/**
 * Retourne les créneaux d'ouverture pour un jour de la semaine donné.
 * endMinutes > 1440 indique un créneau qui dépasse minuit.
 */
function getSlotsForDay(
  day: number,
): { startMinutes: number; endMinutes: number }[] {
  switch (day) {
    case 1: // Lundi : fermé
      return [];
    case 2: // Mardi
    case 3: // Mercredi
    case 4: // Jeudi
      return [
        { startMinutes: 11 * 60, endMinutes: 14 * 60 }, // 11:00–14:00
        { startMinutes: 18 * 60, endMinutes: 22 * 60 }, // 18:00–22:00
      ];
    case 5: // Vendredi
      return [
        { startMinutes: 11 * 60, endMinutes: 14 * 60 },      // 11:00–14:00
        { startMinutes: 18 * 60, endMinutes: 26 * 60 },      // 18:00–02:00 Samedi
      ];
    case 6: // Samedi
      return [
        { startMinutes: 18 * 60, endMinutes: 26 * 60 },      // 18:00–02:00 Dimanche
      ];
    case 0: // Dimanche
      return [
        { startMinutes: 18 * 60, endMinutes: 22 * 60 + 30 }, // 18:00–22:30
      ];
    default:
      return [];
  }
}

/**
 * Retourne l'heure actuelle dans le fuseau Europe/Zurich via l'API Intl native.
 * Fonctionne côté serveur (Vercel/Node.js) et côté client.
 */
function getNowInZurich(): { day: number; hours: number; minutes: number } {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const DAY_INDEX: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  // hour12:false peut retourner "24" pour minuit sur certaines plateformes
  const hours = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const minutes = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  return { day: DAY_INDEX[weekday] ?? 1, hours, minutes };
}

/**
 * Vérifie si le restaurant est actuellement ouvert.
 *
 * @param emergencyClosedUntil  ISO string de fin de fermeture d'urgence (nullable)
 * @returns StoreStatus avec isOpen et la raison éventuelle de fermeture
 */
export function checkStoreStatus(
  emergencyClosedUntil?: string | null,
): StoreStatus {
  // 1. Fermeture d'urgence active ?
  if (emergencyClosedUntil && new Date(emergencyClosedUntil) > new Date()) {
    return {
      isOpen: false,
      reason: "emergency",
      emergencyClosedUntil,
    };
  }

  const { day, hours, minutes } = getNowInZurich();
  const currentMinutes = hours * 60 + minutes;

  // 2. Lundi : toujours fermé
  if (day === 1) {
    return { isOpen: false, reason: "monday" };
  }

  // 3. Vérification du créneau du jour courant
  for (const { startMinutes, endMinutes } of getSlotsForDay(day)) {
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return { isOpen: true };
    }
  }

  // 4. Si avant 4h du matin, vérifier si on est dans l'extension nocturne de la veille
  //    (ex : Samedi 01:00 → dans le créneau Vendredi 18:00–02:00)
  if (hours < 4) {
    const yesterday = (day + 6) % 7;
    const extendedMinutes = currentMinutes + 24 * 60; // traiter comme "heure 24+X"
    for (const { startMinutes, endMinutes } of getSlotsForDay(yesterday)) {
      if (
        endMinutes > 24 * 60 &&
        extendedMinutes >= startMinutes &&
        extendedMinutes < endMinutes
      ) {
        return { isOpen: true };
      }
    }
  }

  return { isOpen: false, reason: "outside_hours" };
}

/**
 * Calcule le timestamp d'expiration automatique d'une fermeture d'urgence.
 *
 * Priorité :
 *   1. Si on est DANS un créneau → expire à la fin de ce créneau
 *   2. Si avant 4h (extension nocturne de la veille) → expire à la fin du créneau nocturne
 *   3. Si ENTRE deux créneaux → expire au début du prochain créneau
 *   4. Fallback : +12h
 */
export function getServiceBlockExpiry(): Date {
  const now = new Date();
  const { day, hours, minutes } = getNowInZurich();
  const currentMinutes = hours * 60 + minutes;

  // Cas 1 : dans un créneau du jour courant
  for (const { startMinutes, endMinutes } of getSlotsForDay(day)) {
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return new Date(now.getTime() + (endMinutes - currentMinutes) * 60_000);
    }
  }

  // Cas 2 : extension nocturne de la veille (avant 4h)
  if (hours < 4) {
    const yesterday = (day + 6) % 7;
    const extended = currentMinutes + 1440;
    for (const { startMinutes, endMinutes } of getSlotsForDay(yesterday)) {
      if (endMinutes > 1440 && extended >= startMinutes && extended < endMinutes) {
        return new Date(now.getTime() + (endMinutes - extended) * 60_000);
      }
    }
  }

  // Cas 3 : entre deux créneaux → prochain créneau dans les 7 prochains jours
  for (let daysAhead = 0; daysAhead <= 7; daysAhead++) {
    const targetDay = (day + daysAhead) % 7;
    const slots = getSlotsForDay(targetDay);
    // Trier par startMinutes pour prendre le plus tôt
    const sorted = [...slots].sort((a, b) => a.startMinutes - b.startMinutes);
    for (const { startMinutes } of sorted) {
      const minutesUntilStart = daysAhead * 1440 + startMinutes - currentMinutes;
      if (minutesUntilStart > 0) {
        return new Date(now.getTime() + minutesUntilStart * 60_000);
      }
    }
  }

  // Fallback : 12h
  return new Date(now.getTime() + 12 * 3_600_000);
}

/**
 * Retourne un libellé human-readable de l'heure de fermeture d'urgence.
 */
export function formatEmergencyUntil(isoString: string): string {
  return new Intl.DateTimeFormat("fr-CH", {
    timeZone: TIMEZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(isoString));
}
