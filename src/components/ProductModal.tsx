"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Minus, Plus, ShoppingCart } from "lucide-react"; // ✅ Nouvelles icônes
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";
import { useCart, MenuItem as ContextMenuItem } from "@/context/CartContext"; // ✅ Import du panier

// On aligne l'interface sur celle du contexte
export interface MenuItem extends ContextMenuItem {
  name_fr: string;
  name_en?: string;
  name_es?: string;
  description_fr: string;
  description_en?: string;
  description_es?: string;
}

interface ProductModalProps {
  item: MenuItem;
  onClose: () => void;
}

export default function ProductModal({ item, onClose }: ProductModalProps) {
  const { lang } = useTranslation();
  const { addToCart } = useCart(); // ✅ Connexion au panier
  const [quantity, setQuantity] = useState(1); // ✅ État pour la quantité

  // LOGIQUE POUR FERMER AVEC ÉCHAP
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
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

  // ✅ Fonction pour ajouter la quantité exacte
  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: item.id,
        name: name,
        price: item.price,
        image_url: item.image_url,
        category: item.category,
      });
    }
    onClose(); // On ferme la modale après l'ajout
  };

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
        className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-kabuki-red transition-colors"
        >
          <X size={20} />
        </button>

        <div className="relative w-full bg-black min-h-[250px] h-[40vh] md:h-[50vh] shrink-0">
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

        <div className="p-6 md:p-8 flex flex-col flex-grow overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start border-b border-neutral-800 pb-4 mb-4 shrink-0">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-wider pr-4">
              {name}
            </h2>
            <div className="text-xl md:text-2xl font-bold text-kabuki-red whitespace-nowrap">
              {Number(item.price).toFixed(2)} <span className="text-xs uppercase">chf</span>
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <h4 className="text-kabuki-red text-[10px] uppercase font-bold tracking-[0.2em]">Description</h4>
            <p className="text-gray-400 text-sm leading-relaxed italic">
              {desc || "Aucune description disponible."}
            </p>
          </div>

          {/* ✅ Zone d'ajout au panier (Toujours en bas) */}
          <div className="mt-auto pt-6 border-t border-neutral-800 flex flex-col sm:flex-row gap-4 items-center">
            
            {/* Sélecteur de quantité */}
            <div className="flex items-center bg-black border border-neutral-700 rounded-full h-12 overflow-hidden w-full sm:w-auto shrink-0">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-full flex items-center justify-center text-white hover:bg-neutral-800 transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center font-bold text-white text-lg">
                {quantity}
              </span>
              <button 
                onClick={() => setQuantity(Math.min(20, quantity + 1))}
                className="w-12 h-full flex items-center justify-center text-white hover:bg-neutral-800 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Bouton Ajouter */}
            <button 
              onClick={handleAddToCart}
              className="flex-1 w-full bg-kabuki-red hover:bg-red-700 text-white font-bold h-12 rounded-full uppercase tracking-widest text-xs md:text-sm transition-colors shadow-lg shadow-red-900/20 flex items-center justify-center gap-3"
            >
              <ShoppingCart size={18} />
              <span>Ajouter • {(item.price * quantity).toFixed(2)} CHF</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}