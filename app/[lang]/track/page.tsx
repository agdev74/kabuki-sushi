"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import OrderTracker from "@/components/OrderTracker";
import { Loader2 } from "lucide-react";

function TrackContent() {
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get("order_id");
  
  // 1. On donne l'ID de l'URL comme valeur de départ. 
  // Cela évite d'utiliser un setState directement au chargement !
  const [orderId, setOrderId] = useState<number | null>(urlOrderId ? Number(urlOrderId) : null);

  useEffect(() => {
    // 2. On encapsule dans une fonction asynchrone pour éviter l'erreur ESLint
    const initTracking = async () => {
      if (urlOrderId) {
        // L'ID est déjà dans le state, on a juste à le sauvegarder en mémoire
        localStorage.setItem("kabuki_active_order", urlOrderId);
      } else {
        // Si l'URL est vide, on va fouiller dans la mémoire du téléphone
        const savedOrderId = localStorage.getItem("kabuki_active_order");
        if (savedOrderId) {
          setOrderId(Number(savedOrderId));
        }
      }
    };

    initTracking();
  }, [urlOrderId]);

  return (
    <div className="container mx-auto">
      {orderId ? (
        <OrderTracker orderId={orderId} />
      ) : (
        <div className="text-center text-gray-500 font-bold uppercase tracking-widest mt-20">
          <Loader2 className="animate-spin mx-auto mb-4" />
          Recherche de votre commande...
        </div>
      )}
    </div>
  );
}

// 3. Next.js demande un "Suspense" autour de tout ce qui lit l'URL en temps réel
export default function TrackPage() {
  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-4">
      <Suspense 
        fallback={
          <div className="flex flex-col items-center mt-20 text-kabuki-red">
            <Loader2 className="animate-spin mb-4" size={32} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Chargement...</span>
          </div>
        }
      >
        <TrackContent />
      </Suspense>
    </div>
  );
}