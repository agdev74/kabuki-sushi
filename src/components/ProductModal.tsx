"use client";

import { useEffect, useState, useMemo } from "react";
import { m } from "framer-motion"; 
import { X, Minus, Plus, ShoppingCart, Maximize2, Info } from "lucide-react";
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

// ✅ AJOUT DU PARFUM "PASSION"
const MOCHI_FLAVORS = ["Mangue", "Matcha", "Fleur de cerisier", "Passion"];

export default function ProductModal({ item, onClose }: ProductModalProps) {
  const { lang } = useTranslation();
  const { addToCart } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  
  // Tableau stockant les parfums pour chaque portion sélectionnée
  const [mochiSelections, setMochiSelections] = useState<[string, string][]>([
    [MOCHI_FLAVORS[0], MOCHI_FLAVORS[0]]
  ]);

  const { name, desc } = useMemo(() => {
    const currentLang = lang.toLowerCase();
    const n = currentLang === "es" ? item.name_es : currentLang === "en" ? item.name_en : item.name_fr;
    const d = currentLang === "es" ? item.description_es : currentLang === "en" ? item.description_en : item.description_fr;
    return {
      name: n?.trim() ? n : item.name_fr,
      desc: d?.trim() ? d : item.description_fr
    };
  }, [lang, item]);

  // ✅ DÉTECTION INDESTRUCTIBLE : ID + Nom sans accents
  const isMochi = useMemo(() => {
    if (String(item.id) === "4") return true;
    
    // Fonction pour retirer les accents et passer en minuscules
    const normalize = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
    
    const safeNameFr = normalize(item.name_fr);
    const safeName = normalize(name);
    
    return safeNameFr.includes("mochi") || safeName.includes("mochi");
  }, [item.id, item.name_fr, name]);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1 || newQty > 20) return;
    
    setQuantity(newQty);
    
    if (isMochi) {
      setMochiSelections(prev => {
        const newSelections = [...prev];
        if (newQty > prev.length) {
          for (let i = prev.length; i < newQty; i++) {
            newSelections.push([MOCHI_FLAVORS[0], MOCHI_FLAVORS[0]]);
          }
        } 
        else if (newQty < prev.length) {
          newSelections.splice(newQty);
        }
        return newSelections;
      });
    }
  };

  const updateMochiFlavor = (portionIndex: number, mochiIndex: 0 | 1, flavor: string) => {
    setMochiSelections(prev => {
      const newSelections = [...prev];
      newSelections[portionIndex][mochiIndex] = flavor;
      return newSelections;
    });
  };

  const handleAddToCart = () => {
    if (isMochi) {
      mochiSelections.forEach(selection => {
        addToCart({
          id: item.id,
          name: `${name} (${selection[0]} & ${selection[1]})`,
          price: item.price,
          image_url: item.image_url,
          category: item.category,
        });
      });
    } else {
      for (let i = 0; i < quantity; i++) {
        addToCart({
          id: item.id,
          name: name,
          price: item.price,
          image_url: item.image_url,
          category: item.category,
        });
      }
    }
    onClose();
  };

  return (
    <m.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/95 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
    >
      <m.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: "transform, opacity" }}
        className="bg-neutral-950 border border-neutral-800 rounded-[2rem] md:rounded-[3rem] overflow-hidden max-w-4xl w-full shadow-2xl relative flex flex-col max-h-[95vh]"
      >
        <button 
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-6 right-6 z-30 bg-white/10 hover:bg-kabuki-red text-white p-3 rounded-full backdrop-blur-md transition-all active:scale-90"
        >
          <X size={24} />
        </button>

        <div className="relative w-full bg-[#050505] h-[40vh] md:h-[45vh] flex-shrink-0 group overflow-hidden border-b border-neutral-900/50">
          {item.image_url ? (
            <Image 
              src={item.image_url} 
              alt={name} 
              fill
              quality={95}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              className="object-contain p-4 md:p-10 transition-transform duration-700 group-hover:scale-105"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-800 font-display text-5xl uppercase opacity-10 tracking-[0.4em]">
              Kabuki
            </div>
          )}

          <div className="absolute bottom-4 left-6 flex items-center gap-2 text-white/20 uppercase text-[8px] tracking-[0.3em] font-bold pointer-events-none">
            <Maximize2 size={10} />
            Définition Optimale
          </div>
        </div>

        <div className="p-8 md:p-12 flex flex-col flex-grow overflow-y-auto no-scrollbar">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
            <div>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-tighter leading-none mb-2">
                {name}
              </h2>
              <span className="text-kabuki-red text-[10px] uppercase font-black tracking-[0.4em]">Signature Kabuki</span>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-white whitespace-nowrap">
              {Number(item.price).toFixed(2)} <span className="text-xs text-neutral-500 uppercase ml-1">chf</span>
            </div>
          </div>
          
          <div className="mb-8 shrink-0">
            <h4 className="text-neutral-600 text-[10px] uppercase font-black tracking-[0.3em] mb-4">Description de la création</h4>
            <p className="text-neutral-400 text-sm md:text-lg leading-relaxed italic font-light max-w-2xl">
              {desc || "L'excellence du sushi Kabuki, préparée avec passion et précision."}
            </p>
          </div>

          {/* DYNAMIC MOCHI SELECTION */}
          {isMochi && (
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                <Info size={14} className="shrink-0" /> Chaque portion contient 2 pièces. Choisissez vos parfums ci-dessous.
              </div>
              
              {mochiSelections.map((selection, idx) => (
                <div key={idx} className="bg-neutral-900 border border-neutral-800 p-4 md:p-5 rounded-2xl">
                  <h5 className="text-[10px] text-kabuki-red uppercase font-black tracking-widest mb-4">
                    Portion {idx + 1}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Mochi 1</label>
                      <select 
                        value={selection[0]} 
                        onChange={(e) => updateMochiFlavor(idx, 0, e.target.value)}
                        className="w-full bg-black border border-neutral-800 p-3 md:p-4 rounded-xl outline-none focus:border-kabuki-red transition text-white font-bold text-sm appearance-none"
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
                      >
                        {MOCHI_FLAVORS.map(flavor => (
                          <option key={`p${idx}-m1-${flavor}`} value={flavor}>{flavor}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Mochi 2</label>
                      <select 
                        value={selection[1]} 
                        onChange={(e) => updateMochiFlavor(idx, 1, e.target.value)}
                        className="w-full bg-black border border-neutral-800 p-3 md:p-4 rounded-xl outline-none focus:border-kabuki-red transition text-white font-bold text-sm appearance-none"
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
                      >
                        {MOCHI_FLAVORS.map(flavor => (
                          <option key={`p${idx}-m2-${flavor}`} value={flavor}>{flavor}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto pt-4 flex flex-col gap-4 w-full shrink-0 border-t border-neutral-900/50">
            <div className="flex items-center justify-between bg-white/5 border border-neutral-800 rounded-2xl min-h-[64px] h-16 w-full px-4 shrink-0 mt-2">
              <button 
                onClick={() => handleQuantityChange(quantity - 1)}
                className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-white transition-colors active:bg-neutral-800 rounded-xl"
              >
                <Minus size={20} />
              </button>
              
              <span className="font-bold text-white text-xl">
                {quantity}
              </span>
              
              <button 
                onClick={() => handleQuantityChange(quantity + 1)}
                className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-white transition-colors active:bg-neutral-800 rounded-xl"
              >
                <Plus size={20} />
              </button>
            </div>

            <button 
              onClick={handleAddToCart}
              className="w-full bg-kabuki-red hover:bg-red-700 text-white font-bold min-h-[64px] h-16 rounded-2xl uppercase tracking-[0.15em] text-sm transition-all active:scale-[0.98] shadow-2xl shadow-red-900/20 flex items-center justify-center gap-4 shrink-0"
            >
              <ShoppingCart size={20} />
              <span>AJOUTER AU PANIER • {(item.price * quantity).toFixed(2)} CHF</span>
            </button>
          </div>
        </div>
      </m.div>
    </m.div>
  );
}