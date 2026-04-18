"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

/**
 * Panneau de contrôle d'urgence Kabuki — Tableau de bord Admin.
 * Lit et écrit la table store_settings (ligne unique id=1).
 *
 * Robustesse :
 *  - Toujours visible : le titre s'affiche même en cas d'erreur Supabase.
 *  - Gestion explicite des erreurs réseau / RLS avec message UI.
 *  - Pas de return null prématuré : seule une section interne change d'état.
 */
export default function EmergencyControl() {
  const supabase = useMemo(() => createClient(), []);

  const [isEmergencyClosed, setIsEmergencyClosed] = useState(false);
  const [closedUntil, setClosedUntil] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadSettings = useMemo(
    () => async () => {
      setLoading(true);
      setFetchError(null);

      const { data, error } = await supabase
        .from("store_settings")
        .select("is_emergency_closed, emergency_closed_until")
        .eq("id", 1)
        .single();

      // On appelle toujours setLoading(false), même en cas d'erreur
      setLoading(false);

      if (error) {
        // Expose le code d'erreur Supabase pour faciliter le diagnostic
        setFetchError(
          `Impossible de charger les paramètres (${error.code ?? error.message}). Vérifiez que la table store_settings existe et que la politique RLS autorise la lecture.`,
        );
        return;
      }

      if (!data) {
        setFetchError(
          "Aucune ligne trouvée dans store_settings (id=1). Exécutez la migration SQL.",
        );
        return;
      }

      setIsEmergencyClosed(data.is_emergency_closed ?? false);
      setClosedUntil(
        data.emergency_closed_until
          ? new Date(data.emergency_closed_until).toISOString().slice(0, 16)
          : "",
      );
    },
    [supabase],
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggle = () => {
    setIsEmergencyClosed((prev) => !prev);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from("store_settings")
      .update({
        is_emergency_closed: isEmergencyClosed,
        emergency_closed_until:
          isEmergencyClosed && closedUntil
            ? new Date(closedUntil).toISOString()
            : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      setFetchError(`Erreur lors de la sauvegarde : ${error.message}`);
    } else {
      setSaved(true);
      setFetchError(null);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  // ─── Rendu — le titre est TOUJOURS affiché ────────────────────────────────

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isEmergencyClosed && !fetchError
          ? "border-red-500/40 bg-red-950/20"
          : "border-neutral-800 bg-neutral-900/50"
      }`}
    >
      {/* En-tête — visible en toutes circonstances */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div className="flex items-center gap-3">
          <AlertTriangle
            size={20}
            className={
              fetchError
                ? "text-amber-500"
                : isEmergencyClosed
                  ? "text-red-500"
                  : "text-gray-500"
            }
          />
          <div>
            <h3 className="text-white font-bold uppercase tracking-widest text-sm">
              Fermeture d&apos;Urgence
            </h3>
            {!loading && !fetchError && (
              <p className="text-[10px] text-gray-500 mt-0.5">
                {isEmergencyClosed
                  ? "Le restaurant apparaît comme FERMÉ sur le site"
                  : "Le restaurant est OUVERT selon les horaires normaux"}
              </p>
            )}
          </div>
        </div>

        {/* Toggle — masqué pendant le chargement ou en cas d'erreur */}
        {!loading && !fetchError && (
          <button
            onClick={handleToggle}
            aria-pressed={isEmergencyClosed}
            aria-label="Activer/désactiver la fermeture d'urgence"
            className="transition-transform active:scale-95"
          >
            {isEmergencyClosed ? (
              <ToggleRight size={44} className="text-red-500" />
            ) : (
              <ToggleLeft size={44} className="text-gray-600" />
            )}
          </button>
        )}
      </div>

      <div className="p-6 pt-4 space-y-4">
        {/* ── État : chargement ── */}
        {loading && (
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Chargement des paramètres...
            </span>
          </div>
        )}

        {/* ── État : erreur de fetch ── */}
        {!loading && fetchError && (
          <div className="space-y-3">
            <div
              role="alert"
              className="flex items-start gap-3 bg-amber-900/20 border border-amber-500/30 text-amber-400 p-4 rounded-xl"
            >
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold leading-relaxed">{fetchError}</p>
            </div>
            <button
              onClick={loadSettings}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition"
            >
              <RefreshCw size={12} /> Réessayer
            </button>
          </div>
        )}

        {/* ── État : chargé avec succès ── */}
        {!loading && !fetchError && (
          <>
            {/* Date/heure de réouverture — visible seulement si toggle ON */}
            {isEmergencyClosed && (
              <div className="space-y-2">
                <label
                  htmlFor="reopen-datetime"
                  className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"
                >
                  <Calendar size={12} /> Réouverture prévue (heure Zurich)
                </label>
                <input
                  id="reopen-datetime"
                  type="datetime-local"
                  value={closedUntil}
                  onChange={(e) => {
                    setClosedUntil(e.target.value);
                    setSaved(false);
                  }}
                  className="w-full bg-black text-white border border-red-500/30 focus:border-red-500 rounded-xl px-4 py-3 outline-none transition text-sm"
                />
                <p className="text-[9px] text-gray-600 uppercase tracking-widest">
                  Laissez vide pour une fermeture sans date de fin définie.
                </p>
              </div>
            )}

            {/* Bouton Sauvegarder */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full font-bold py-3 rounded-xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${
                saved
                  ? "bg-green-600 text-white"
                  : "bg-kabuki-red hover:bg-red-700 text-white disabled:opacity-50"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Sauvegarde...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 size={14} /> Sauvegardé
                </>
              ) : (
                "Appliquer"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
