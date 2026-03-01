"use client";

import { useState } from "react";
import dynamic from "next/dynamic"; // ✅ Ajout de l'import dynamique
import Navbar from "@/components/Navbar";
import MobileActionBar from "@/components/MobileActionBar";

import ScrollToTop from "@/components/ScrollToTop";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";

// ✅ CHARGEMENT DYNAMIQUE DU PANIER
// ssr: false empêche Next.js d'essayer de rendre le panier sur le serveur.
// Cela économise du temps de calcul et évite de charger Stripe trop tôt.
const CartDrawer = dynamic(() => import("@/components/CartDrawer"), {
  ssr: false,
});

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <>
    
      
      {/* On passe openCart à la Navbar pour l'icône panier desktop/mobile */}
      <Navbar onOpenCart={openCart} />

      <main className="flex-1">
        {children}
      </main>

      <ScrollToTop />

      {/* La nouvelle barre intelligente reçoit la fonction d'ouverture */}
      <MobileActionBar onOpenCart={openCart} />

      <CookieBanner />

      <Footer />

      {/* ✅ Le Drawer du panier est maintenant chargé dynamiquement */}
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}