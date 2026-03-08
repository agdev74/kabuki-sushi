"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, AlertTriangle } from "lucide-react";
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

  // Utilisation de MouseEvent au lieu de FormEvent pour plus de stabilité
  const handleUpdate = async () => {
    alert("1. Entrée dans handleUpdate");

    if (!user) {
      alert("2. ERREUR : L'objet user est introuvable");
      return;
    }

    alert("3. ID utilisateur détecté : " + user.id);
    
    setIsUpdating(true);
    setErrorMsg(null);

    try {
      alert("4. Envoi de la requête à Supabase...");
      
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

      if (error) {
        alert("5. ERREUR SUPABASE : " + error.message);
        throw error;
      }

      alert("6. SUCCESS ! Les données sont enregistrées.");
      
      // On reste sur la page sans recharger pour l'instant
      setIsUpdating(false);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      alert("7. CATCH ERROR : " + msg);
      setErrorMsg(msg);
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
        <TransitionLink href={`/${lang}/profile`} className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8">
          <ArrowLeft size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Retour</span>
        </TransitionLink>

        {/* Suppression de la balise <form> pour éviter tout rechargement sauvage */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <h1 className="text-2xl font-display font-bold text-white uppercase tracking-widest mb-4">Finaliser le Profil</h1>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nom complet" className="w-full bg-black border border-neutral-800 rounded-xl py-4 px-4 text-white outline-none focus:border-kabuki-red" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" className="w-full bg-black border border-neutral-800 rounded-xl py-4 px-4 text-white outline-none focus:border-kabuki-red" />
            </div>

            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse" className="w-full bg-black border border-neutral-800 rounded-xl py-4 px-4 text-white outline-none focus:border-kabuki-red" />
            
            <div className="grid grid-cols-2 gap-4">
               <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Code Postal" className="w-full bg-black border border-neutral-800 rounded-xl py-4 px-4 text-white outline-none focus:border-kabuki-red" />
               <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville" className="w-full bg-black border border-neutral-800 rounded-xl py-4 px-4 text-white outline-none focus:border-kabuki-red" />
            </div>

            {errorMsg && (
              <div className="text-red-500 text-xs flex items-center gap-2">
                <AlertTriangle size={14}/> {errorMsg}
              </div>
            )}

            <button 
              type="button" 
              onClick={handleUpdate}
              disabled={isUpdating} 
              className="w-full bg-kabuki-red text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50"
            >
              {isUpdating ? "En cours..." : "Enregistrer les informations"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}