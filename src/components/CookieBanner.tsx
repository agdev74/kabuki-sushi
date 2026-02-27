"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { Cookie, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation(); // ✅ Désormais utilisé plus bas

  useEffect(() => {
    const consent = localStorage.getItem("kabuki_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (status: "accepted" | "declined") => {
    localStorage.setItem("kabuki_cookie_consent", status);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-10 md:max-w-md z-[100]"
        >
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="bg-kabuki-red/10 p-3 rounded-xl text-kabuki-red">
                <Cookie size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-2">
                  {t.nav.home ? "Cookies & Confidentialité" : "Privacy Policy"}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-4">
                  Nous utilisons des cookies pour améliorer votre expérience. En continuant, vous acceptez notre politique de confidentialité.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleConsent("accepted")}
                    className="flex-1 bg-white text-black py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-gray-200 transition"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => handleConsent("declined")}
                    className="flex-1 bg-transparent border border-neutral-700 text-gray-400 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-neutral-800 transition"
                  >
                    Refuser
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}