"use client";

import { useUser } from "@/context/UserContext";
import { m } from "framer-motion";
import { User, History, Settings, ChevronRight, AlertCircle, Shield } from "lucide-react";
import { useParams } from "next/navigation";
import TransitionLink from "@/components/TransitionLink";
import OrderHistory from "@/components/OrderHistory";

export default function ProfilePage() {
  const { user, profile, loading } = useUser();
  const params = useParams();
  
  // ✅ Typage sécurisé des paramètres d'URL
  const lang = typeof params.lang === 'string' ? params.lang : 'fr';

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="w-12 h-12 border-4 border-kabuki-red border-t-transparent rounded-full animate-spin" />
            <p className="text-kabuki-red text-xs font-bold uppercase tracking-widest animate-pulse">
              Synchronisation...
            </p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 bg-neutral-900/30 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
            <AlertCircle size={48} className="text-kabuki-red mb-2" />
            <h1 className="text-2xl font-display font-bold text-white uppercase tracking-widest">Accès réservé</h1>
            <p className="text-gray-400 max-w-md mx-auto">
              Votre session a expiré ou vous n&apos;êtes pas connecté. Veuillez vous identifier pour accéder à votre espace.
            </p>
            <button 
              onClick={() => {
                // 🔔 TODO : Insérer ici la fonction d'ouverture de la modale
              }}
              className="bg-kabuki-red text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Se connecter
            </button>
          </div>
        ) : (
          <>
            <m.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl"
            >
              <div className="w-24 h-24 bg-kabuki-red/10 rounded-full flex items-center justify-center border-2 border-kabuki-red shadow-lg shadow-red-900/20">
                <User size={48} className="text-kabuki-red" />
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-2">
                  {profile?.full_name || (profile?.is_admin ? "Admin Kabuki" : "Client Kabuki")}
                </h1>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest opacity-70">{user.email}</p>
              </div>
              <div className="bg-black/40 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 text-center min-w-[200px]">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-1">Cagnotte Fidélité</p>
                <p className="text-3xl font-display font-bold text-kabuki-red">
                  {profile?.wallet_balance ? Number(profile.wallet_balance).toFixed(2) : "0.00"} <span className="text-sm">CHF</span>
                </p>
              </div>
            </m.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <m.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="md:col-span-2 bg-neutral-900/50 border border-neutral-800 p-8 rounded-3xl shadow-xl"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-kabuki-red/10 rounded-2xl text-kabuki-red">
                    <History size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-white uppercase tracking-widest">Historique</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Vos dernières commandes</p>
                  </div>
                </div>

                <OrderHistory />
              </m.div>

              <div className="space-y-6">
                
                {profile?.is_admin && (
                  <TransitionLink href={`/${lang}/admin`} className="block">
                    <m.div 
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(38, 38, 38, 0.8)" }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-kabuki-red/10 border border-kabuki-red/50 p-6 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-kabuki-red transition-all duration-300 shadow-xl"
                    >
                      <div className="p-3 bg-kabuki-red text-white rounded-xl">
                        <Shield size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Administration</h3>
                        <p className="text-[10px] text-kabuki-red uppercase">Panneau de contrôle</p>
                      </div>
                      <ChevronRight size={18} className="text-kabuki-red" />
                    </m.div>
                  </TransitionLink>
                )}

                <TransitionLink href={`/${lang}/profile/settings`} className="block">
                  <m.div 
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(38, 38, 38, 0.8)" }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-kabuki-red transition-all duration-300 shadow-xl"
                  >
                    <div className="p-3 bg-neutral-800 text-white rounded-xl">
                      <Settings size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-sm uppercase tracking-wider">Paramètres</h3>
                      <p className="text-[10px] text-gray-500 uppercase">Gérer le compte</p>
                    </div>
                    <ChevronRight size={18} className="text-neutral-600" />
                  </m.div>
                </TransitionLink>

                <div className="bg-neutral-900/30 border border-neutral-800/50 p-6 rounded-2xl">
                  <p className="text-[10px] text-gray-500 uppercase leading-relaxed">
                    Besoin d&apos;aide ? Contactez notre support pour toute question concernant vos commandes.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}