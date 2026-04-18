"use client";

import { useTranslation } from "@/context/LanguageContext";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function WhatsAppButton() {
  const { lang } = useTranslation();

  // Numéro de Kabuki (Format international E.164 sans +)
  const phoneNumber = "41786767100";

  // Message pré-rempli selon la langue
  const getDefaultMessage = () => {
    switch (lang) {
      case "en":
        return "Hello Kabuki team! I would like to place an order/book a table...";
      case "es":
        return "¡Hola equipo Kabuki! Me gustaría hacer un pedido/reservar una mesa...";
      case "fr":
      default:
        return "Bonjour l'équipe Kabuki ! J'aimerais passer une commande/réserver une table...";
    }
  };

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(getDefaultMessage())}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      // ✅ CHANGEMENT : "hidden md:flex" cache le bouton sur mobile et l'affiche dès 768px (tablette/PC)
      className="hidden md:flex fixed bottom-10 right-10 z-50 group items-center gap-3"
      aria-label="Contactez-nous sur WhatsApp"
    >
      {/* Infobulle (visible uniquement au survol sur ordinateur) */}
      <span className="absolute right-16 bg-white text-black text-xs font-bold py-2 px-4 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-neutral-200">
        {lang === "fr" ? "Commander via WhatsApp" : lang === "es" ? "Pedir por WhatsApp" : "Order via WhatsApp"}
      </span>

      {/* Le Bouton */}
      <div className="relative bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#20bd5a] hover:scale-110 transition-all duration-300">
        <MessageCircle size={32} />
        
        {/* Point de notification */}
        <span className="absolute top-0 right-0 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-kabuki-red border-2 border-white"></span>
        </span>
      </div>
    </motion.a>
  );
}