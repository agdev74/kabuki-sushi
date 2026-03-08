"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, User, Phone, MapPin, AlertTriangle } from "lucide-react";
import { useParams } from "next/navigation";
import TransitionLink from "@/components/TransitionLink";

export default function SettingsPage() {
  const { user, profile, loading } = useUser(); 
  const { lang } = useParams();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Si cette alerte n'apparaît pas, le code ne tourne pas.
    alert("🚀 BOUTON CLIQUÉ - DÉBUT");

    if (!user?.id) {
      alert("❌ ERREUR : ID utilisateur manquant");
      return;
    }

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
        }, { onConflict: 'id' });

      if (error) throw error;

      alert("✅ SUCCÈS : Base de données mise à jour !");
      
      // On force le rechargement pour voir les changements
      window.location.reload();

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setErrorMsg(msg);
      alert("❌ ERREUR SUPABASE : " + msg);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-kabuki-red border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-6 text-white">
      <div className="max-w-2xl mx-auto">
        <TransitionLink href={`/${lang}/profile`} className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Retour</span>
        </TransitionLink>

        <form onSubmit={handleUpdate} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <h1 className="text-2xl font-display font-bold text-white uppercase tracking-widest mb-4">Paramètres</h1>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-kabuki-red outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-black border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-kabuki-red outline-none" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Adresse</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input required type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-black border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-kabuki-red outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <input required type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="CP" className="w-full bg-black border border-neutral-800 rounded-xl py-4 px-4 text-white focus:border-kabuki-red outline-none" />
              <input required type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville" className="w-full bg-black border border-neutral-800 rounded-xl py-4 px-4 text-white focus:border-kabuki-red outline-none" />
            </div>

            {errorMsg && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 text-xs uppercase tracking-wider">
                <AlertTriangle size={16} /> {errorMsg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isUpdating} 
              className="w-full bg-kabuki-red text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 shadow-lg shadow-red-900/20"
            >
              {isUpdating ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}