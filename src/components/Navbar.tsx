"use client";

import { useState } from "react";
import TransitionLink from "./TransitionLink";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { m, AnimatePresence } from "framer-motion"; 
import { useTranslation } from "@/context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { ShoppingCart, User as UserIcon } from "lucide-react"; 
import { useCart } from "@/context/CartContext"; 

// ✅ NOUVEAUX IMPORTS POUR L'AUTH
import { useUser } from "@/context/UserContext"; 
import AuthModal from "./AuthModal";

interface NavbarProps {
  onOpenCart: () => void;
}

export default function Navbar({ onOpenCart }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // ✅ État pour la modale
  
  const pathname = usePathname();
  const { t, lang } = useTranslation();
  const { totalItems } = useCart(); 
  const { user, profile, signOut } = useUser(); // ✅ On récupère l'user depuis le contexte !

  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (isOpen) setIsOpen(false);
  }

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { name: t?.nav?.home || "Accueil", path: `/${lang}` },
    { name: t?.nav?.menu || "Menu", path: `/${lang}/menu` },
    { name: t?.nav?.catering || "Traiteur", path: `/${lang}/traiteur` },
    { name: t?.nav?.contact || "Contact", path: `/${lang}/contact` },
  ];

  return (
    <nav className="bg-kabuki-black text-white fixed w-full z-50 border-b border-neutral-800 shadow-lg">
      <div className="container mx-auto px-6 h-20 flex justify-between items-center">
        
        <TransitionLink 
          href={`/${lang}`} 
          className="relative w-24 md:w-32 hover:scale-105 transition-transform duration-300"
          onClick={() => setIsOpen(false)}
          aria-label="Retour à l'accueil Kabuki Sushi"
        >
          <Image 
            src="/images/logo.png" 
            alt="Kabuki Logo" 
            width={120} 
            height={120}
            sizes="(max-width: 768px) 96px, 120px" 
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
                isActive(link.path) ? "text-white" : "text-gray-300 hover:text-white"
              }`}
            >
              {link.name}
              {isActive(link.path) && (
                <m.div 
                  layoutId="activeNav"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-kabuki-red"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </TransitionLink>
          ))}
          
          <button 
            onClick={onOpenCart} 
            aria-label={`Ouvrir le panier, ${totalItems} articles`}
            className="relative group p-2 active:scale-90 transition-transform"
          >
            <ShoppingCart size={22} className="text-gray-300 group-hover:text-white transition-colors" />
            <AnimatePresence>
              {totalItems > 0 && (
                <m.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-kabuki-red text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-kabuki-black"
                >
                  {totalItems}
                </m.div>
              )}
            </AnimatePresence>
          </button>

          <LanguageSwitcher />

          {/* ✅ BOUTON CONNEXION / PROFIL DESKTOP */}
          <div className="pl-4 border-l border-neutral-800 flex items-center h-8">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-white capitalize">{profile?.full_name || "Client"}</span>
                  <span className="text-[10px] font-bold text-kabuki-red uppercase tracking-widest">
                    Cagnotte: {profile?.wallet_balance ? Number(profile.wallet_balance).toFixed(2) : "0.00"} CHF
                  </span>
                </div>
                <button 
                  onClick={signOut}
                  className="text-[10px] text-gray-400 hover:text-white transition uppercase tracking-widest bg-neutral-900 px-2 py-1 rounded"
                >
                  Déco
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white transition"
              >
                <UserIcon size={16} className="text-kabuki-red" /> Connexion
              </button>
            )}
          </div>

          {user && (
            <TransitionLink 
              href={`/${lang}/admin/menu`} 
              className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded border border-white/20 font-bold uppercase tracking-widest transition-colors text-kabuki-red ml-2"
            >
              Admin
            </TransitionLink>
          )}

        </div>

        {/* --- MOBILE NAV BUTTONS --- */}
        <div className="flex md:hidden items-center space-x-5">
          {/* ✅ BOUTON CONNEXION MOBILE (Icone seule) */}
          <button
            onClick={() => user ? signOut() : setIsAuthModalOpen(true)}
            aria-label={user ? "Déconnexion" : "Connexion"}
            className="relative p-2 active:scale-90 transition-transform"
          >
            <UserIcon size={22} className={user ? "text-kabuki-red" : "text-white"} />
          </button>

          <button 
            onClick={onOpenCart} 
            aria-label={`Ouvrir le panier, ${totalItems} articles`}
            className="relative p-2 z-50 active:scale-90 transition-transform"
          >
            <ShoppingCart size={24} className="text-white" />
            <AnimatePresence>
              {totalItems > 0 && (
                <m.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-0 right-0 bg-kabuki-red text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-kabuki-black"
                >
                  {totalItems}
                </m.div>
              )}
            </AnimatePresence>
          </button>

          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="z-50 w-8 h-10 flex flex-col justify-center items-center"
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isOpen}
          >
            <m.span 
              animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
              className="w-8 h-0.5 bg-white block mb-2 rounded-full"
            ></m.span>
            <m.span 
              animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-8 h-0.5 bg-kabuki-red block mb-2 rounded-full"
            ></m.span>
            <m.span 
              animate={isOpen ? { rotate: -45, y: -10 } : { rotate: 0, y: 0 }}
              className="w-8 h-0.5 bg-white block rounded-full"
            ></m.span>
          </button>
        </div>
      </div>

      {/* --- MENU MOBILE --- */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 bg-kabuki-black z-40 flex flex-col items-center justify-center md:hidden"
          >
            {/* ✅ AFFICHAGE CAGNOTTE DANS LE MENU MOBILE */}
            {user && profile && (
              <div className="absolute top-24 w-full flex justify-center">
                <div className="bg-neutral-900 border border-neutral-800 rounded-full px-6 py-2 flex items-center gap-3">
                  <span className="text-xs font-bold text-white capitalize">{profile.full_name}</span>
                  <span className="w-1 h-1 bg-kabuki-red rounded-full" />
                  <span className="text-[10px] font-bold text-kabuki-red uppercase tracking-widest">
                    {Number(profile.wallet_balance).toFixed(2)} CHF
                  </span>
                </div>
              </div>
            )}

            <ul className="space-y-8 text-center mt-12">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <TransitionLink 
                    href={link.path}
                    className={`text-3xl font-display font-bold uppercase tracking-widest block transition-colors ${
                      isActive(link.path) ? "text-kabuki-red" : "text-white hover:text-gray-300"
                    }`}
                  >
                    {link.name}
                  </TransitionLink>
                </li>
              ))}

              <li className="pt-8 flex flex-col items-center gap-6">
                  <TransitionLink 
                    href={`/${lang}/traiteur#devis`} 
                    className="bg-kabuki-red text-white px-8 py-4 rounded-full font-bold text-lg uppercase tracking-wider hover:bg-red-700 transition shadow-xl"
                  >
                    {t?.hero?.btnTraiteur || "Devis Traiteur"}
                  </TransitionLink>

                  <div className="pt-4 border-t border-neutral-800 w-full flex justify-center">
                    <LanguageSwitcher />
                  </div>
              </li>
            </ul>
          </m.div>
        )}
      </AnimatePresence>

      {/* ✅ LA MODALE D'AUTHENTIFICATION */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
}