"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, CheckCircle, AlertTriangle, Save } from "lucide-react";
import { useParams } from "next/navigation";
import TransitionLink from "@/components/TransitionLink";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useUser();
  const { lang } = useParams();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialisation synchronisée avec le profil
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setZipCode(profile.zip_code || "");
      setCity(profile.city || "");
    }
  }, [profile]);

  const handleUpdate = async () => {
    if (!user?.id) return;
    setIsUpdating(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: fullName,
          phone: phone,
          address: address,
          zip_code: zipCode,
          city: city,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // refreshProfile est maintenant "silent" (voir modif UserContext précédente)
      await refreshProfile();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: unknown) {
      // ✅ Correction ESLint : On traite 'unknown' au lieu de 'any'
      const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue est survenue";
      setErrorMsg(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // 🛡️ ON NE RETOURNE PLUS JAMAIS DE SPINNER ICI
  // On laisse la page affichée même si loading est true dans le contexte
  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-6 text-white">
      <div className="max-w-2xl mx-auto">
        <TransitionLink href={`/${lang}/profile`} className="mb-8 inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors">
          <ArrowLeft size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Retour au profil</span>
        </TransitionLink>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-display font-bold uppercase tracking-widest">Mon Profil</h1>
            {isUpdating && <div className="w-4 h-4 border-2 border-kabuki-red border-t-transparent rounded-full animate-spin" />}
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Nom complet</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black border border-neutral-800 p-4 rounded-xl focus:border-kabuki-red outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Téléphone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-black border border-neutral-800 p-4 rounded-xl focus:border-kabuki-red outline-none transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Adresse</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-black border border-neutral-800 p-4 rounded-xl focus:border-kabuki-red outline-none transition-all" />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
               <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Code Postal" className="w-full bg-black border border-neutral-800 p-4 rounded-xl focus:border-kabuki-red outline-none transition-all" />
               <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville" className="w-full bg-black border border-neutral-800 p-4 rounded-xl focus:border-kabuki-red outline-none transition-all" />
            </div>

            {errorMsg && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-2 text-xs uppercase animate-pulse">
                <AlertTriangle size={16} /> {errorMsg}
              </div>
            )}

            <button 
              type="button"
              onClick={handleUpdate}
              disabled={isUpdating} 
              className="w-full bg-kabuki-red text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Mise à jour..." : <><Save size={18} /> Sauvegarder</>}
            </button>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Modifications enregistrées</span>
        </div>
      )}
    </div>
  );
}