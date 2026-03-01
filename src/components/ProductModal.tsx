"use client";

import { useEffect, useState, useMemo } from "react";
import { m } from "framer-motion"; // ✅ Utilisation de 'm' (Lazy)
import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";
import { useCart, MenuItem as ContextMenuItem } from "@/context/CartContext";

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
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // ✅ VERROUILLAGE DU SCROLL & GESTION ÉCHAP
  useEffect(() => {
    document.body.style.overflow = "hidden"; // Empêche le scroll du fond
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "unset"; // Libère le scroll à la fermeture
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  // ✅ TRADUCTIONS MÉMOÏSÉES (Performance)
  const { name, desc } = useMemo(() => {
    const currentLang = lang.toLowerCase();
    const n = currentLang === "es" ? item.name_es : currentLang === "en" ? item.name_en : item.name_fr;
    const d = currentLang === "es" ? item.description_es : currentLang === "en" ? item.description_en : item.description_fr;
    return {
      name: n?.trim() ? n : item.name_fr,
      desc: d?.trim() ? d : item.description_fr
    };
  }, [lang, item]);

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
    onClose();
  };

  return (
    <m.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <m.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: "transform, opacity" }}
        className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] overflow-hidden max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        {/* BOUTON FERMER */}
        <button 
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-5 right-5 z-20 bg-black/40 text-white p-2.5 rounded-full hover:bg-kabuki-red transition-all active:scale-90"
        >
          <X size={20} />
        </button>

        {/* IMAGE DU PRODUIT */}
        <div className="relative w-full bg-[#050505] min-h-[250px] h-[35vh] md:h-[45vh] shrink-0 border-b border-neutral-800/50">
          {item.image_url ? (
            <Image 
              src={item.image_url} 
              alt={name} 
              fill
              className="object-contain p-8 md:p-12"
              sizes="(max-width: 768px) 100vw, 800px"
              priority // ✅ Priorité pour éviter le "flicker" à l'ouverture
            />
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-800 font-display text-4xl uppercase opacity-10 tracking-[0.2em]">
              Kabuki
            </div>
          )}
        </div>

        {/* CONTENU TEXTE */}
        <div className="p-6 md:p-10 flex flex-col flex-grow overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-start gap-4 mb-6 shrink-0">
            <h2 id="modal-title" className="text-2xl md:text-4xl font-display font-bold text-white uppercase tracking-tighter pr-4 leading-none">
              {name}
            </h2>
            <div className="text-2xl md:text-3xl font-bold text-kabuki-red whitespace-nowrap">
              {Number(item.price).toFixed(2)} <span className="text-[10px] uppercase opacity-60 tracking-widest">chf</span>
            </div>
          </div>
          
          <div className="mb-10">
            <h4 className="text-neutral-500 text-[10px] uppercase font-black tracking-[0.3em] mb-3">Description</h4>
            <p className="text-neutral-400 text-sm md:text-base leading-relaxed italic font-light">
              {desc || "L'excellence du sushi Kabuki, préparée avec passion."}
            </p>
          </div>

          {/* SÉLECTEUR & ACTION (FOOTER FIXE) */}
          <div className="mt-auto pt-6 border-t border-neutral-800/50 flex flex-col sm:flex-row gap-4 items-center">
            
            {/* SÉLECTEUR DE QUANTITÉ */}
            <div className="flex items-center bg-black/50 border border-neutral-800 rounded-2xl h-14 w-full sm:w-auto overflow-hidden">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-14 h-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors active:bg-neutral-800"
              >
                <Minus size={18} />
              </button>
              <span className="w-12 text-center font-bold text-white text-xl">
                {quantity}
              </span>
              <button 
                onClick={() => setQuantity(Math.min(20, quantity + 1))}
                className="w-14 h-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors active:bg-neutral-800"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* BOUTON AJOUTER */}
            <button 
              onClick={handleAddToCart}
              className="flex-1 w-full bg-kabuki-red hover:bg-red-700 text-white font-bold h-14 rounded-2xl uppercase tracking-[0.15em] text-xs transition-all active:scale-[0.98] shadow-2xl shadow-red-900/20 flex items-center justify-center gap-3"
            >
              <ShoppingCart size={18} />
              <span>Ajouter • {(item.price * quantity).toFixed(2)} CHF</span>
            </button>
          </div>
        </div>
      </m.div>
    </m.div>
  );
}