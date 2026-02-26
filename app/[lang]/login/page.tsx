"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext"; // ✅ Import du contexte de langue

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { lang } = useTranslation(); // ✅ Récupération de la langue actuelle (fr, en, ou es)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Identifiants incorrects. Vérifie ton accès.");
      setLoading(false);
    } else {
      // ✅ FIX REDIRECTION : On ajoute dynamiquement la langue devant le chemin
      router.push(`/${lang}/admin/menu`);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Texture de fond subtile pour le rappel du site */}
      <div className="fixed inset-0 bg-[url('/pattern-kimono.png')] opacity-[0.03] pointer-events-none"></div>

      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-10 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-kabuki-red rounded-xl flex items-center justify-center font-bold text-white mx-auto mb-4 shadow-lg shadow-red-900/20">
            K
          </div>
          <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tighter">
            Kabuki <span className="text-kabuki-red">Admin</span>
          </h1>
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em] mt-2 font-bold">
            Accès restreint au personnel
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Email</label>
            <input
              type="email"
              placeholder="admin@kabuki-sushi.ch"
              className="w-full bg-black border border-neutral-800 p-4 rounded-xl text-white outline-none focus:border-kabuki-red transition shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-black border border-neutral-800 p-4 rounded-xl text-white outline-none focus:border-kabuki-red transition shadow-inner"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
              <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-widest">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-kabuki-red text-white py-5 rounded-xl font-bold uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-xl shadow-red-900/20 disabled:opacity-50 text-xs mt-4"
          >
            {loading ? "Vérification..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}