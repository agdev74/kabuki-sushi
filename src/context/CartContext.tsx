"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ✅ 1. Définition de la structure d'un plat
export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
}

// 2. Un article du panier = un plat + une quantité
export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

// 3. Création du Contexte
const CartContext = createContext<CartContextType | undefined>(undefined);

// 4. Le Provider
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger le panier depuis la mémoire du navigateur au démarrage
  useEffect(() => {
    const savedCart = localStorage.getItem("kabuki_cart");
    if (savedCart) {
      try {
        // ✅ On remet le passe-droit juste pour cette ligne !
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Erreur de lecture du panier", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarder le panier à chaque modification
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("kabuki_cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  // Ajouter un produit
  const addToCart = (item: MenuItem) => {
    setItems((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // Supprimer un produit
  const removeFromCart = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Mettre à jour la quantité
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  // Vider le panier
  const clearCart = () => {
    setItems([]);
  };

  // Calculs automatiques
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// 5. Hook personnalisé
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart doit être utilisé à l'intérieur d'un CartProvider");
  }
  return context;
}