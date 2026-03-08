"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import { 
  UtensilsCrossed, 
  LogOut,
  ArrowLeft,
  ShoppingBag,
  Truck,
  BarChart3,
  Ticket 
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";

export default function AdminHeader({ lang }: { lang: string }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = `/${lang}/login?logout=true`;
  };

  const isActive = (path: string) => {
    if (path.endsWith('/admin')) {
        return pathname === path; 
    }
    return pathname === path || pathname?.startsWith(path + "/");
  };

  const adminLinks = [
    { 
      name: "Commandes", 
      path: `/${lang}/admin`, 
      icon: <ShoppingBag size={16} /> 
    },
    { 
      name: t.nav.menu || "Carte", 
      path: `/${lang}/admin/menu`, 
      icon: <UtensilsCrossed size={16} /> 
    },
    { 
      name: "Coupons", 
      path: `/${lang}/admin/coupons`, 
      icon: <Ticket size={16} /> 
    },
    { 
      name: "Livreur", 
      path: `/${lang}/admin/driver`, 
      icon: <Truck size={16} /> 
    },
    { 
      name: "Stats", 
      path: `/${lang}/admin/stats`, 
      icon: <BarChart3 size={16} /> 
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-black/90 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-20 flex justify-between items-center">
        
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-8 h-8 bg-kabuki-red rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/20">
              K
            </div>
            <Link 
              href={`/${lang}`} 
              className="hidden xl:flex items-center gap-2 text-gray-500 hover:text-white transition text-[10px] font-bold uppercase tracking-widest border border-neutral-800 px-3 py-1.5 rounded-full"
            >
              <ArrowLeft size={12} /> Voir le site
            </Link>
          </div>

          <nav className="flex items-center gap-1 md:gap-2">
            {adminLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-[10px] md:text-[11px] font-bold transition-all duration-300 ${
                  isActive(link.path)
                    ? "bg-kabuki-red text-white shadow-xl shadow-red-900/30"
                    : "text-gray-400 hover:text-white hover:bg-neutral-800/50"
                }`}
              >
                {link.icon}
                <span className="uppercase tracking-[0.12em] hidden lg:inline">{link.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold text-gray-500 hover:text-white hover:bg-red-600/10 border border-transparent hover:border-red-600/20 transition-all uppercase tracking-widest group shrink-0"
        >
          <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Quitter</span>
        </button>
      </div>
    </header>
  );
}