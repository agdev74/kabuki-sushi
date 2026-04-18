"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LazyMotion, domMax } from "framer-motion";
import Navbar from "@/components/Navbar";
import MobileActionBar from "@/components/MobileActionBar";
import PageLoader from "@/components/PageLoader";
import ScrollToTop from "@/components/ScrollToTop";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";
import StoreStatusBanner from "@/components/StoreStatusBanner";

// ✅ CHARGEMENT DYNAMIQUE DU PANIER
const CartDrawer = dynamic(() => import("@/components/CartDrawer"), {
  ssr: false,
});

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <LazyMotion features={domMax} strict>
      <div className="flex flex-col min-h-screen">
        <PageLoader />
        
        <Navbar onOpenCart={openCart} />
        <StoreStatusBanner />

        <main className="flex-1">
          {children}
        </main>

        <ScrollToTop />

        {/* ✅ L'Action Bar gère maintenant l'urgence (Appel/WhatsApp) de manière intégrée */}
        <MobileActionBar onOpenCart={openCart} />

        <CookieBanner />

        <Footer />

        <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      </div>
    </LazyMotion>
  );
}