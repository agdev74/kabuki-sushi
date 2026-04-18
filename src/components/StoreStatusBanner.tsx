"use client";

import { useEffect, useState, useMemo } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { checkStoreStatus, formatEmergencyUntil } from "@/utils/storeHours";

/**
 * Bannière rouge persistante affichée quand le restaurant est fermé.
 * Bypasse le cache Next.js via useEffect (fetch côté client à chaque montage).
 * Se rafraîchit automatiquement chaque minute pour les transitions d'horaires.
 */
export default function StoreStatusBanner() {
  const supabase = useMemo(() => createClient(), []);
  const [isClosed, setIsClosed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function refreshStatus() {
      // Lecture sans cache : le client Supabase contourne tout SSR/cache Next.js
      const { data } = await supabase
        .from("store_settings")
        .select("is_emergency_closed, emergency_closed_until")
        .eq("id", 1)
        .single();

      const emergencyUntil =
        data?.is_emergency_closed ? (data.emergency_closed_until ?? null) : null;

      const status = checkStoreStatus(emergencyUntil);

      setIsClosed(!status.isOpen);

      if (!status.isOpen) {
        if (status.reason === "emergency" && status.emergencyClosedUntil) {
          setMessage(
            `Restaurant fermé exceptionnellement — Réouverture prévue le ${formatEmergencyUntil(status.emergencyClosedUntil)}`,
          );
        } else if (status.reason === "monday") {
          setMessage(
            "Fermé le Lundi — Précommandez votre créneau pour un autre jour",
          );
        } else {
          setMessage(
            "Restaurant fermé pour l'instant — Précommandez votre créneau",
          );
        }
      }
    }

    refreshStatus();
    // Rafraîchissement toutes les minutes pour capter les changements d'horaire
    const interval = setInterval(refreshStatus, 60_000);
    return () => clearInterval(interval);
  }, [supabase]);

  if (!isClosed) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="sticky top-0 z-40 bg-red-700 text-white py-3 px-6 flex items-center justify-center gap-3 shadow-lg"
    >
      <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
      <p className="text-xs font-bold uppercase tracking-widest text-center">
        {message}
      </p>
      <Clock size={16} className="shrink-0" aria-hidden="true" />
    </div>
  );
}
