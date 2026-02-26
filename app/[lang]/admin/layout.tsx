"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import { 
  UtensilsCrossed, 
  Star, 
  MessageSquare, 
  LogOut,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/utils/supabase";

// Import du composant WhatsApp
import WhatsAppButton from "@/components/WhatsAppButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { lang, t } = useTranslation();

  // ✅ FIX DÉCONNEXION : On redirige vers la route localisée (ex: /fr/login)
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    // On force la redirection vers le login avec la langue actuelle
    window.location.href = `/${lang}/login?logout=true`;
  };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");

  const adminLinks = [
    { 
      name: t.nav.menu || "Carte", 
      path: `/${lang}/admin/menu`, 
      icon: <UtensilsCrossed size={16} /> 
    },
    { 
      name: "Avis", 
      path: `/${lang}/admin/avis`, 
      icon: <Star size={16} /> 
    },
    { 
      name: "Messages", 
      path: `/${lang}/admin/messages`, 
      icon: <MessageSquare size={16} /> 
    },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      
      {/* --- HEADER ADMIN --- */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-black/90 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          
          <div className="flex items-center gap-8">
            {/* Logo et Retour Site localisé */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-kabuki-red rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/20">
                K
              </div>
              <Link 
                href={`/${lang}`} 
                className="hidden md:flex items-center gap-2 text-gray-500 hover:text-white transition text-[10px] font-bold uppercase tracking-widest border border-neutral-800 px-3 py-1.5 rounded-full"
              >
                <ArrowLeft size={12} /> Voir le site
              </Link>
            </div>

            {/* Navigation Horizontale Localisée */}
            <nav className="flex items-center gap-2">
              {adminLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-300 ${
                    isActive(link.path)
                      ? "bg-kabuki-red text-white shadow-xl shadow-red-900/30"
                      : "text-gray-400 hover:text-white hover:bg-neutral-800/50"
                  }`}
                >
                  {link.icon}
                  <span className="uppercase tracking-[0.15em]">{link.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Bouton Déconnexion */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold text-gray-500 hover:text-white hover:bg-red-600/10 border border-transparent hover:border-red-600/20 transition-all uppercase tracking-widest group"
          >
            <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* --- ZONE DE CONTENU --- */}
      <main className="relative">
        {/* Subtile texture de fond */}
        <div className="fixed inset-0 bg-[url('/pattern-kimono.png')] opacity-[0.03] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          {children}
        </div>
      </main>

      {/* WhatsApp Button */}
      <WhatsAppButton />

    </div>
  );
}