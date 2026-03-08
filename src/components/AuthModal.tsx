"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User as UserIcon, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const supabase = createClient();
  const [isLogin, setIsLogin] = useState(true); // true = Connexion, false = Inscription
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        // --- CONNEXION ---
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (signInError) throw signInError;
        
        onClose(); // On ferme la modale si succès
      } else {
        // --- INSCRIPTION ---
        if (!formData.fullName.trim()) throw new Error("Le nom complet est requis.");
        
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName, // Envoyé au trigger SQL !
            },
          },
        });
        if (signUpError) throw signUpError;
        
        setSuccess("Compte créé avec succès ! Vous êtes maintenant connecté.");
        setTimeout(() => onClose(), 2000); // Ferme après 2s
      }
   } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 md:p-8">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-widest mb-2">
                  {isLogin ? "Connexion" : "Créer un compte"}
                </h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                  {isLogin ? "Accédez à votre cagnotte fidélité" : "Rejoignez le club Kabuki"}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-900/20 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-3 bg-green-900/20 border border-green-500/20 rounded-xl text-green-500 text-xs font-bold text-center">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1 overflow-hidden"
                    >
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nom Complet</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                          type="text"
                          required={!isLogin}
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Jean Dupont"
                          className="w-full bg-black text-white border border-neutral-800 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-kabuki-red transition text-sm"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="votre@email.com"
                      className="w-full bg-black text-white border border-neutral-800 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-kabuki-red transition text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-black text-white border border-neutral-800 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-kabuki-red transition text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-kabuki-red text-white font-bold py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700 transition shadow-lg shadow-red-900/30 mt-6"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      {isLogin ? "Se Connecter" : "S'inscrire"} <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-gray-400 hover:text-white text-xs font-bold transition uppercase tracking-wider"
                >
                  {isLogin ? "Pas encore de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}