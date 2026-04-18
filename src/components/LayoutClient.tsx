"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { LazyMotion, domMax } from "framer-motion";
import Navbar from "@/components/Navbar";
import MobileActionBar from "@/components/MobileActionBar";
import PageLoader from "@/components/PageLoader";
import ScrollToTop from "@/components/ScrollToTop";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";
import StoreStatusBanner from "@/components/StoreStatusBanner";

const CartDrawer = dynamic(() => import("@/components/CartDrawer"), {
  ssr: false,
});

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();

  // Sur les pages /admin, seul l'AdminHeader (dans admin/layout.tsx) doit être
  // visible. On retire entièrement la navbar publique du DOM pour éviter tout
  // conflit de z-index ou d'affichage parasite au scroll.
  const isAdmin = !!pathname?.match(/\/admin(\/|$)/);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <LazyMotion features={domMax} strict>
      <div className="flex flex-col min-h-screen">
        <PageLoader />

        {!isAdmin && <Navbar onOpenCart={openCart} />}
        {!isAdmin && <StoreStatusBanner />}

        <main className="flex-1">
          {children}
        </main>

        <ScrollToTop />

        {!isAdmin && <MobileActionBar onOpenCart={openCart} />}
        {!isAdmin && <CookieBanner />}
        {!isAdmin && <Footer />}
        {!isAdmin && (
          <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
        )}
      </div>
    </LazyMotion>
  );
}