"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { getServiceBlockExpiry } from "@/utils/storeHours";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";

/**
 * Badge de statut d'urgence Kabuki — intégré dans l'AdminHeader.
 *
 * Machine d'états :
 *   loading ──(fetch OK)──> idle
 *   idle    ──(1er clic)──> confirming  (compte à rebours 3 s)
 *   confirming ─(2e clic)──> saving ──(Supabase OK)──> idle
 *   confirming ─(timeout)──> idle  (annulation silencieuse)
 *
 * Supabase : lit/écrit store_settings.id=1
 */

type Phase = "loading" | "idle" | "confirming" | "saving";

export default function StatusBadge() {
  const supabase = useMemo(() => createClient(), []);

  const [isClosed, setIsClosed]   = useState(false);
  const [phase, setPhase]         = useState<Phase>("loading");
  const [countdown, setCountdown] = useState(3);
  const timerRef                  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Chargement initial + reset passif si expirée ──────────────────────────
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("is_emergency_closed, emergency_closed_until")
        .eq("id", 1)
        .single();

      if (data) {
        const isExpired =
          data.is_emergency_closed &&
          data.emergency_closed_until &&
          new Date(data.emergency_closed_until) <= new Date();

        if (isExpired) {
          // Reset passif : la fermeture est expirée, on nettoie en DB
          await supabase
            .from("store_settings")
            .update({ is_emergency_closed: false, emergency_closed_until: null, updated_at: new Date().toISOString() })
            .eq("id", 1);
          setIsClosed(false);
        } else {
          setIsClosed(data.is_emergency_closed ?? false);
        }
      }
      setPhase("idle");
    })();
  }, [supabase]);

  // ── Compte à rebours (actif uniquement en phase "confirming") ──────────────
  useEffect(() => {
    if (phase !== "confirming") {
      if (timerRef.current) clearInterval(timerRef.current);
      setCountdown(3);
      return;
    }

    // Démarrage propre depuis 3
    setCountdown(3);
    let tick = 3;

    timerRef.current = setInterval(() => {
      tick -= 1;
      setCountdown(tick);
      if (tick <= 0) {
        clearInterval(timerRef.current!);
        setPhase("idle"); // Délai expiré → retour à l'état initial
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // ── Gestion du clic ────────────────────────────────────────────────────────
  const handleClick = async () => {
    if (phase === "loading" || phase === "saving") return;

    // 1er clic → demande de confirmation
    if (phase === "idle") {
      setPhase("confirming");
      return;
    }

    // 2e clic pendant le délai → exécution réelle
    if (phase === "confirming") {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase("saving");

      const next = !isClosed;
      const { error } = await supabase
        .from("store_settings")
        .update({
          is_emergency_closed: next,
          emergency_closed_until: next ? getServiceBlockExpiry().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (!error) setIsClosed(next);
      setPhase("idle");
    }
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────

  // Chargement
  if (phase === "loading") {
    return (
      <div className="flex items-center gap-2 h-9 px-3 rounded-full bg-neutral-800/50 border border-neutral-800/60 text-neutral-600">
        <Loader2 size={12} className="animate-spin" />
        <span className="text-[9px] font-bold uppercase tracking-widest hidden lg:inline">
          Chargement
        </span>
      </div>
    );
  }

  // Sauvegarde en cours
  if (phase === "saving") {
    return (
      <div className="flex items-center gap-2 h-9 px-3 rounded-full bg-neutral-800 border border-neutral-700 text-gray-400">
        <Loader2 size={12} className="animate-spin text-kabuki-red" />
        <span className="text-[9px] font-bold uppercase tracking-widest hidden lg:inline">
          Mise à jour…
        </span>
      </div>
    );
  }

  // Confirmation en attente
  if (phase === "confirming") {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 h-9 px-3 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 transition-colors"
        aria-live="polite"
        aria-label="Cliquez à nouveau pour confirmer"
      >
        <span className="text-[9px] font-black uppercase tracking-widest">
          Confirmer ?
        </span>
        {/* Cercle compte à rebours */}
        <span className="w-5 h-5 rounded-full bg-amber-500/30 border border-amber-400/50 flex items-center justify-center text-[10px] font-black tabular-nums">
          {countdown}
        </span>
      </button>
    );
  }

  // ── État stable : ouvert ou fermé ──────────────────────────────────────────

  if (isClosed) {
    return (
      <button
        onClick={handleClick}
        title="Cliquer pour rouvrir le restaurant"
        className="flex items-center gap-2 h-9 px-3 rounded-full bg-red-600 border border-red-500 text-white shadow-lg shadow-red-900/40 hover:bg-red-700 transition-colors"
      >
        <ShieldAlert size={13} className="animate-pulse shrink-0" />
        <span className="text-[9px] font-black uppercase tracking-[0.12em] hidden sm:inline">
          Fermeture Active
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      title="Cliquer pour déclencher une fermeture d'urgence"
      className="flex items-center gap-2 h-9 px-3 rounded-full bg-neutral-800/70 border border-neutral-700/50 text-gray-400 hover:text-white hover:bg-neutral-700/70 transition-colors"
    >
      {/* Point vert pulsant */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <ShieldCheck size={13} className="shrink-0 hidden sm:inline" />
      <span className="text-[9px] font-bold uppercase tracking-widest hidden lg:inline">
        Restaurant Ouvert
      </span>
    </button>
  );
}
