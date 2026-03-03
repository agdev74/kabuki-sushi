"use client";

import { useState, useMemo, useCallback, memo } from "react";
import Image from "next/image";
import { m, AnimatePresence, Variants, LazyMotion, domAnimation } from "framer-motion"; 
import { Search, Info, Plus, Minus } from "lucide-react";
import Reveal from "@/components/Reveal";
import { useTranslation } from "@/context/LanguageContext";
import ProductModal from "@/components/ProductModal";
import { useCart, MenuItem as ContextMenuItem } from "@/context/CartContext";

// --- TYPES & UTILS ---
export interface MenuItem extends ContextMenuItem {
  name_fr: string;
  name_en?: string;
  name_es?: string;
  description_fr: string;
  description_en?: string;
  description_es?: string;
  is_available: boolean;
}

// ✅ NOUVEAU : On déclare la prop que le serveur nous envoie
interface MenuClientProps {
  initialItems: MenuItem[];
}

// --- VARIANTS OPTIMISÉS ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03, 
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3 } 
  },
};

// --- COMPOSANT CARTE MÉMOÏSÉ ---
const MenuItemCard = memo(({ item, index, onClick }: { item: MenuItem; index: number; onClick: (item: MenuItem) => void }) => {
  const { lang } = useTranslation();
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const [imgError, setImgError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const displayName = useMemo(() => {
    const currentLang = lang.toLowerCase();
    if (currentLang === "es") return item.name_es?.trim() ? item.name_es : item.name_fr;
    if (currentLang === "en") return item.name_en?.trim() ? item.name_en : item.name_fr;
    return item.name_fr;
  }, [lang, item]);

  const displayDesc = useMemo(() => {
    const currentLang = lang.toLowerCase();
    if (currentLang === "es") return item.description_es?.trim() ? item.description_es : item.description_fr;
    if (currentLang === "en") return item.description_en?.trim() ? item.description_en : item.description_fr;
    return item.description_fr;
  }, [lang, item]);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({ id: item.id, name: displayName, price: item.price, image_url: item.image_url, category: item.category });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 1) {
      updateQuantity(item.id, quantity - 1);
    } else {
      removeFromCart(item.id);
    }
  };

  return (
    <m.div 
      variants={itemVariants}
      onClick={() => onClick(item)}
      className="bg-neutral-800 rounded-xl shadow-lg overflow-hidden hover:border-kabuki-red transition-colors duration-300 group border border-neutral-700 flex flex-col h-full cursor-pointer relative"
    >
      <div className="w-full bg-neutral-900 relative aspect-square overflow-hidden">
        <AnimatePresence>
          {quantity > 0 && (
            <m.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-2 left-2 z-20 bg-kabuki-red text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-white/10"
            >
              {quantity}
            </m.div>
          )}
        </AnimatePresence>

        {!imgError && item.image_url ? (
          <>
            <Image 
              src={item.image_url}
              alt={displayName}
              fill
              quality={75}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className={`object-cover transition-opacity duration-500 group-hover:scale-105 ${
                isImageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setIsImageLoaded(true)}
              priority={index < 4} 
              fetchPriority={index < 4 ? "high" : "auto"}
              onError={() => setImgError(true)}
            />
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-neutral-800 animate-pulse z-10" />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-800 italic text-neutral-500 text-[10px] uppercase tracking-tighter">
            KABUKI SUSHI
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Info size={14} aria-hidden="true" />
        </div>
      </div>
      
      <div className="p-3 flex flex-col flex-grow relative">
        <div className="flex-1 min-w-0 mb-3">
          <h3 className="text-[11px] font-bold text-white uppercase line-clamp-1 leading-tight font-display tracking-wide mb-1">
            {displayName.split('(')[0]}
          </h3>
          <p className="text-neutral-400 text-[9px] line-clamp-2 leading-tight">
            {displayDesc}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-700/50">
          <span className="text-white font-bold text-[10px] whitespace-nowrap">
            {Number(item.price).toFixed(2)} <span className="text-[7px] text-neutral-500 ml-0.5">CHF</span>
          </span>

          <div className="flex items-center bg-neutral-900 rounded-full p-0.5 border border-neutral-700">
            <AnimatePresence mode="popLayout">
              {quantity > 0 && (
                <m.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="flex items-center overflow-hidden"
                >
                  <button onClick={handleRemove} aria-label="Moins" className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
                    <Minus size={12} strokeWidth={2.5} />
                  </button>
                  <span className="text-[10px] font-bold text-white w-4 text-center">{quantity}</span>
                </m.div>
              )}
            </AnimatePresence>

            <button 
              onClick={handleAdd}
              aria-label="Plus"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                quantity > 0 ? "text-kabuki-red" : "bg-neutral-700 text-white hover:bg-kabuki-red"
              }`}
            >
              <Plus size={12} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </m.div>
  );
});

MenuItemCard.displayName = "MenuItemCard";

// ✅ CORRECTION : Le composant accepte maintenant "initialItems"
export default function MenuClient({ initialItems }: MenuClientProps) {
  const { t, lang } = useTranslation();
  
  // ✅ CORRECTION ESLINT : On utilise directement initialItems sans useState car la liste ne change pas
  const items = initialItems;
  
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

  const filteredItems = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return items.filter((item) => {
      const matchesSearch = item.name_fr?.toLowerCase().includes(searchLower) || 
                          item.description_fr?.toLowerCase().includes(searchLower);
      const matchesCategory = activeCategory === "Tous" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, activeCategory]);

  const rawCategories = useMemo(() => Array.from(new Set(items.map(item => item.category))), [items]);
  
  const filterCategories = useMemo(() => [
    { id: "Tous", label: t.menu.all },
    ...rawCategories.map(cat => ({
      id: cat || "Non classé",
      label: (t.menu.categories as Record<string, string>)?.[cat || ""] || cat 
    }))
  ], [t.menu.all, t.menu.categories, rawCategories]);

  const handleOpenModal = useCallback((item: MenuItem) => {
    setSelectedProduct(item);
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <div className="bg-[#080808] min-h-screen pb-32 pt-24 relative">
        <div className="bg-black text-white py-12 md:py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern-kimono.png')] opacity-5 z-0" aria-hidden="true"></div>
          <Reveal>
            <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-widest relative z-10">
              {t.menu.title}
            </h1>
            <div className="w-12 h-1 bg-kabuki-red mx-auto mt-6 relative z-10"></div>
          </Reveal>
        </div>

        <div className="sticky top-[70px] z-30 bg-[#080808]/80 backdrop-blur-xl py-4 border-b border-neutral-900 mb-8">
          <div className="container mx-auto px-4">
            <div className="relative max-w-md mx-auto mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={16} aria-hidden="true" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "fr" ? "Rechercher..." : "Search..."}
                aria-label="Rechercher un plat"
                className="w-full bg-black border border-neutral-800 rounded-2xl py-2 pl-12 pr-4 text-xs text-white focus:border-kabuki-red outline-none shadow-xl transition-all"
              />
            </div>

            <nav className="flex flex-nowrap overflow-x-auto md:justify-center gap-2 pb-2 no-scrollbar" aria-label="Catégories">
              {filterCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  aria-pressed={activeCategory === cat.id}
                  className={`flex-shrink-0 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    activeCategory === cat.id 
                    ? "bg-kabuki-red border-kabuki-red text-white" 
                    : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <m.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6"
          >
            {/* L'affichage se fait instantanément avec les données initiales */}
            {filteredItems.map((item, index) => (
              <MenuItemCard 
                key={item.id} 
                item={item} 
                index={index}
                onClick={handleOpenModal} 
              />
            ))}
          </m.div>
        </div>

        <AnimatePresence>
          {selectedProduct && (
            <ProductModal 
              item={selectedProduct} 
              onClose={() => setSelectedProduct(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}