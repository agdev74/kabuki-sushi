"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PackageSearch } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function ActiveOrderButton() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const pathname = usePathname();
  const { lang } = useTranslation();

  useEffect(() => {
    // Vérifier la présence d'une commande dans le LocalStorage
    const checkActiveOrder = () => {
      const savedOrder = localStorage.getItem("kabuki_active_order");
      setOrderId(savedOrder);
    };

    // On vérifie au chargement du composant et à chaque changement de page
    checkActiveOrder();
  }, [pathname]);

  // 🔴 On cache le bouton si le client est déjà sur la page de suivi !
  if (pathname.includes("/track") || pathname.includes("/admin")) {
    return null;
  }

  return (
    <AnimatePresence>
      {orderId && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          // Placement : en bas à droite (au-dessus de la barre mobile si besoin)
          className="fixed bottom-24 right-4 md:bottom-10 md:right-10 z-[60]"
        >
          <Link 
            href={`/${lang}/track`}
            className="flex items-center gap-3 bg-kabuki-red text-white px-5 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:scale-105 transition-transform border border-red-400"
          >
            <PackageSearch size={18} className="animate-pulse" />
            <span>Suivre ma commande</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}