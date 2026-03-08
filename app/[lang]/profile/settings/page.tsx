"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/utils/supabase/client";
import { m, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, User, Phone, CheckCircle, MapPin, Trash2, AlertTriangle } from "lucide-react";
import { useParams } from "next/navigation";
import TransitionLink from "@/components/TransitionLink";

export default function SettingsPage() {
  const { user, profile, refreshProfile, loading } = useUser(); 
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
    const targetId = profile?.id || user?.id;
    setErrorMsg(null);

    if (!targetId) {
      setErrorMsg("Session expirée. Veuillez recharger la page.");
      return;
    }

    setIsUpdating(true);

    const safetyTimeout = setTimeout(() => {
      setIsUpdating(false);
      setErrorMsg("La connexion semble bloquée par un problème de cache (Cookies désynchronisés).");
      console.warn("⏱️ Timeout déclenché : Le client Supabase est resté figé en cherchant la session.");
    }, 8000);

    try {
      console.log("📡 ETAPE 2 : Supabase cherche la session interne...");
      
      // ✅ ANTI-FREEZE : On force le réveil de la session AVANT la requête réseau
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("✅ ETAPE 2.5 : Session réveillée !", sessionData);
      
      console.log("📡 ETAPE 3 : Envoi de l'Upsert à la base de données...");
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: targetId,
          full_name: fullName,
          phone: phone,
          address: address,
          zip_code: zipCode,
          city: city,
          updated_at: new Date().toISOString(),
        })
        .select();

      console.log("✅ ETAPE 4 : Réponse de la base de données !", data);

      if (error) throw error;

      await refreshProfile();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("💥 ETAPE ERREUR :", err);
      setErrorMsg("Une erreur est survenue lors de la sauvegarde.");
    } finally {
      clearTimeout(safetyTimeout);
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-kabuki-red border-t-transparent rounded-full animate-spin" /></div>;

  if (!user) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-display font-bold text-white uppercase mb-4">Session expirée</h1>
      <p className="text-gray-400 mb-8 uppercase text-xs tracking-wider">Veuillez vous reconnecter pour modifier vos paramètres.</p>
      <TransitionLink href={`/${lang}`} className="bg-kabuki-red text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
        Se connecter
      </TransitionLink>
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        <TransitionLink href={`/${lang}/profile`} className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Retour au profil</span>
        </TransitionLink>

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <h1 className="text-2xl font-display font-bold text-white uppercase tracking-widest mb-4">Informations Personnelles</h1>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-kabuki-red outline-none transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-black border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-kabuki-red outline-none transition-colors" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Adresse de livraison</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rue et numéro" className="w-full bg-black border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-kabuki-red outline-none transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Code Postal" className="w-full bg-black border border-neutral-800 rounded-xl py-4 px-4 text-white focus:border-kabuki-red outline-none transition-colors" />
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville" className="w-full bg-black border border-neutral-800 rounded-xl py-4 px-4 text-white focus:border-kabuki-red outline-none transition-colors" />
              </div>

              <AnimatePresence>
                {errorMsg && (
                  <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 text-xs uppercase tracking-wider">
                    <AlertTriangle size={16} /> {errorMsg}
                  </m.div>
                )}
              </AnimatePresence>

              <button 
                type="button" 
                onClick={handleUpdate}
                disabled={isUpdating} 
                className="w-full bg-kabuki-red text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 shadow-lg shadow-red-900/20"
              >
                {isUpdating ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <><Save size={18} /> Sauvegarder les modifications</>}
              </button>
            </div>
          </div>

          <div className="bg-red-900/10 border border-red-900/20 rounded-3xl p-8">
            <h2 className="text-red-500 font-bold uppercase tracking-widest text-sm mb-2 flex items-center gap-2">
              <Trash2 size={16} /> Zone de danger
            </h2>
            <p className="text-xs text-gray-500 mb-6 uppercase tracking-wider">La suppression de votre compte est irréversible et supprimera votre cagnotte.</p>
            <button onClick={() => alert("Contactez le support pour la suppression")} className="text-red-500 text-[10px] font-bold uppercase border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all">
              Supprimer mon compte
            </button>
          </div>
        </m.div>

        <AnimatePresence>
          {showSuccess && (
            <m.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl z-50">
              <CheckCircle size={20} /><span className="text-xs font-bold uppercase tracking-widest">Profil mis à jour !</span>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}