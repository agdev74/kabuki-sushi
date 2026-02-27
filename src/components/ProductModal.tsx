"use client";

import { useEffect } from "react"; // ✅ Ajout de useEffect
import { motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";

interface MenuItem {
  id: number;
  name_fr: string;
  name_en?: string;
  name_es?: string;
  description_fr: string;
  description_en?: string;
  description_es?: string;
  price: number;
  image_url?: string;
}

interface ProductModalProps {
  item: MenuItem;
  onClose: () => void;
}

export default function ProductModal({ item, onClose }: ProductModalProps) {
  const { lang } = useTranslation();

  // ✅ LOGIQUE POUR FERMER AVEC ÉCHAP
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    
    // Nettoyage de l'événement quand la modale se ferme
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const getTranslation = () => {
    const currentLang = lang.toLowerCase();
    const name = currentLang === "es" ? item.name_es : currentLang === "en" ? item.name_en : item.name_fr;
    const desc = currentLang === "es" ? item.description_es : currentLang === "en" ? item.description_en : item.description_fr;
    return {
      name: name && name.trim() !== "" ? name : item.name_fr,
      desc: desc && desc.trim() !== "" ? desc : item.description_fr
    };
  };

  const { name, desc } = getTranslation();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-kabuki-red transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col">
          <div className="relative w-full bg-black min-h-[300px] h-[50vh] md:h-[60vh]">
            {item.image_url ? (
              <Image 
                src={item.image_url} 
                alt={name} 
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-700 font-display text-4xl uppercase opacity-20 italic">
                Kabuki
              </div>
            )}
          </div>

          <div className="p-8 md:p-10 space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-wider">
                {name}
              </h2>
              <div className="text-xl md:text-2xl font-bold text-kabuki-red">
                {Number(item.price).toFixed(2)} <span className="text-xs uppercase">chf</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-kabuki-red text-[10px] uppercase font-bold tracking-[0.2em]">Description</h4>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed italic">
                {desc || "Aucune description disponible."}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}