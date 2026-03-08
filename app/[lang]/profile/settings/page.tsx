"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/utils/supabase/client";
import { m, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, User, Phone, CheckCircle } from "lucide-react";
import { useParams } from "next/navigation";
import TransitionLink from "@/components/TransitionLink";

export default function SettingsPage() {
  const { profile, refreshProfile } = useUser();
  const { lang } = useParams();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Synchronisation initiale avec le profil existant
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq("id", profile.id);

      if (error) throw error;

      await refreshProfile();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      alert("Une erreur est survenue lors de la mise à jour.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        {/* RETOUR */}
        <TransitionLink 
          href={`/${lang}/profile`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Retour au profil</span>
        </TransitionLink>

        <m.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl"
        >
          <h1 className="text-2xl font-display font-bold text-white uppercase tracking-widest mb-8">
            Paramètres du compte
          </h1>

          <form onSubmit={handleUpdate} className="space-y-6">
            {/* NOM COMPLET */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Votre nom"
                  className="w-full bg-black border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-kabuki-red outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* TÉLÉPHONE */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+41 XX XXX XX XX"
                  className="w-full bg-black border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-kabuki-red outline-none transition-colors"
                />
              </div>
            </div>

            {/* BOUTON SAUVEGARDER */}
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-kabuki-red text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-red-900/20"
            >
              {isUpdating ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} /> Sauvegarder les modifications
                </>
              )}
            </button>
          </form>
        </m.div>

        {/* FEEDBACK SUCCÈS */}
        <AnimatePresence>
          {showSuccess && (
            <m.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl z-50"
            >
              <CheckCircle size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Profil mis à jour !</span>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}