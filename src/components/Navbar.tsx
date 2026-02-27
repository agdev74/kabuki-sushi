"use client";

import { useState, useEffect } from "react";
import TransitionLink from "./TransitionLink";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { supabase } from "@/utils/supabase";
import { User } from "@supabase/supabase-js"; 
import { ShoppingCart } from "lucide-react"; // ✅ Icône du panier
import { useCart } from "@/context/CartContext"; // ✅ Connexion au panier
import CartDrawer from "./CartDrawer"; // ✅ Import du tiroir du panier

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); // ✅ État du tiroir
  const [user, setUser] = useState<User | null>(null); 
  
  const pathname = usePathname();
  const { t, lang } = useTranslation();
  const { totalItems } = useCart(); // ✅ Récupération du nombre d'articles

  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (isOpen) {
      setIsOpen(false);
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { name: t.nav.home || "Accueil", path: `/${lang}` },
    { name: t.nav.menu, path: `/${lang}/menu` },
    { name: t.nav.catering, path: `/${lang}/traiteur` },
    { name: t.nav.contact, path: `/${lang}/contact` },
  ];

  return (
    <nav className="bg-kabuki-black text-white fixed w-full z-50 border-b border-neutral-800 shadow-lg">
      <div className="container mx-auto px-6 h-20 flex justify-between items-center">
        
        <TransitionLink 
          href={`/${lang}`} 
          className="relative w-24 md:w-32 hover:scale-105 transition-transform duration-300"
          onClick={() => setIsOpen(false)}
        >
          <Image 
            src="/images/logo.png" 
            alt="Kabuki Logo" 
            width={120} 
            height={120}
            className="w-full h-auto object-contain"
            priority
          />
        </TransitionLink>

        {/* --- DESKTOP NAV --- */}
        <div className="hidden md:flex space-x-8 items-center">
          {navLinks.map((link) => (
            <TransitionLink 
              key={link.path} 
              href={link.path}
              className={`text-sm font-bold uppercase tracking-widest transition-colors duration-300 relative py-2 ${
                isActive(link.path) ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {link.name}
              {isActive(link.path) && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-kabuki-red"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </TransitionLink>
          ))}
          
          {/* ✅ ICÔNE DU PANIER (Desktop) */}
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="relative group p-2"
          >
            <ShoppingCart size={22} className="text-gray-300 group-hover:text-white transition-colors" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-kabuki-red text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-kabuki-black"
                >
                  {totalItems}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <TransitionLink 
            href={`/${lang}/traiteur#devis`} 
            className="bg-kabuki-red text-white px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition shadow-lg shadow-red-900/20"
          >
            {t.hero.btnTraiteur}
          </TransitionLink>

          {user && (
            <TransitionLink 
              href={`/${lang}/admin/menu`} 
              className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded border border-white/20 font-bold uppercase tracking-widest transition-colors text-kabuki-red"
            >
              Admin
            </TransitionLink>
          )}

          <LanguageSwitcher />
        </div>

        {/* --- MOBILE NAV BUTTONS --- */}
        <div className="flex md:hidden items-center space-x-6">
          {/* ✅ ICÔNE DU PANIER (Mobile) - Toujours visible à côté du burger */}
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="relative p-2 z-50"
          >
            <ShoppingCart size={24} className="text-white" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-0 right-0 bg-kabuki-red text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-kabuki-black"
                >
                  {totalItems}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="z-50 w-8 h-10 flex flex-col justify-center items-center focus:outline-none"
          >
            <motion.span 
              animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
              className="w-8 h-0.5 bg-white block mb-2 rounded-full"
            ></motion.span>
            <motion.span 
              animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-8 h-0.5 bg-kabuki-red block mb-2 rounded-full"
            ></motion.span>
            <motion.span 
              animate={isOpen ? { rotate: -45, y: -10 } : { rotate: 0, y: 0 }}
              className="w-8 h-0.5 bg-white block rounded-full"
            ></motion.span>
          </button>
        </div>

      </div>

      {/* --- MENU MOBILE DÉROULANT --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 bg-kabuki-black z-40 flex flex-col items-center justify-center md:hidden"
          >
            <ul className="space-y-8 text-center">
              {navLinks.map((link) => (
                <li key={link.path} className="relative">
                  <TransitionLink 
                    href={link.path}
                    className={`text-3xl font-display font-bold uppercase tracking-widest block transition-colors ${
                      isActive(link.path) ? "text-kabuki-red" : "text-white hover:text-gray-400"
                    }`}
                  >
                    {link.name}
                  </TransitionLink>
                </li>
              ))}

              {user && (
                <li>
                  <TransitionLink 
                    href={`/${lang}/admin/menu`} 
                    className="text-kabuki-red font-display font-bold uppercase tracking-widest block text-xl underline"
                  >
                    Panneau Admin
                  </TransitionLink>
                </li>
              )}

              <li className="pt-8 flex flex-col items-center gap-6">
                  <TransitionLink 
                    href={`/${lang}/traiteur#devis`} 
                    className="bg-kabuki-red text-white px-8 py-4 rounded-full font-bold text-lg uppercase tracking-wider hover:bg-red-700 transition shadow-xl"
                  >
                    {t.hero.btnTraiteur}
                  </TransitionLink>

                  <div className="pt-4 border-t border-neutral-800 w-full flex justify-center">
                    <LanguageSwitcher />
                  </div>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ TIROIR DU PANIER */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </nav>
  );
}