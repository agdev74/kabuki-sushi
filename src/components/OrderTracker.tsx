"use client";

import { useEffect, useState } from "react";
// ✅ CORRECTION IMPORT : On utilise la nouvelle méthode d'export
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, ChefHat, Package, CheckCircle2, Loader2, ArrowRight, XCircle, Truck } from "lucide-react"; 
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import dynamic from "next/dynamic";

const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), { 
  ssr: false,
  loading: () => <div className="h-64 bg-neutral-900 animate-pulse rounded-2xl flex items-center justify-center text-gray-500 text-xs border border-neutral-800">Chargement du GPS...</div>
});

interface OrderData {
  id: number;
  pickup_time: string;
  status: string;
  order_type: string;
  driver_lat: number | null;
  driver_lng: number | null;
}

interface OrderTrackerProps {
  orderId: number;
}

export default function OrderTracker({ orderId }: OrderTrackerProps) {
  // ✅ CORRECTION CLIENT : Initialisation du client Supabase à l'intérieur du composant
  const supabase = createClient();
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const { lang } = useTranslation();

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, pickup_time, status, order_type, driver_lat, driver_lng")
        .eq("id", orderId)
        .single();

      if (error) {
        console.error("Erreur lors du chargement de la commande:", error);
      } else if (data) {
        setOrder(data as OrderData);
      }
      setLoading(false);
    };

    fetchOrder();

    const subscription = supabase
      .channel(`public:orders:id=eq.${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        // ✅ CORRECTION TYPAGE : Utilisation de unknown au lieu de any pour satisfaire ESLint
        (payload: { new: unknown }) => {
          setOrder(payload.new as OrderData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [orderId, supabase]); // Ajout de supabase dans le tableau des dépendances

  const handleFinish = () => {
    localStorage.removeItem("kabuki_active_order");
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-kabuki-red" /></div>;
  if (!order) return <div className="text-center p-10 text-gray-500 font-bold uppercase tracking-widest text-sm">Commande introuvable</div>;

  const isDelivery = order.order_type === "Livraison";
  const steps = isDelivery ? [
    { id: "Payé", label: "Validée", icon: Receipt },
    { id: "En préparation", label: "En cuisine", icon: ChefHat },
    { id: "Prête", label: "Attente livreur", icon: Package },
    { id: "En livraison", label: "En route", icon: Truck },
    { id: "Livrée", label: "Livrée", icon: CheckCircle2 }
  ] : [
    { id: "Payé", label: "Validée", icon: Receipt },
    { id: "En préparation", label: "En cuisine", icon: ChefHat },
    { id: "Prête", label: "Prête pour retrait", icon: Package },
    { id: "Livrée", label: "Terminée", icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === order.status);
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;
  
  const isDelivered = order.status === "Livrée";
  const isCancelled = order.status === "Annulée"; 
  
  const showMap = isDelivery && (order.status === "En livraison" || (order.driver_lat && order.driver_lng));

  return (
    <div className="space-y-6 max-w-lg mx-auto px-2">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl overflow-hidden">
        
        <div className="text-center mb-8">
          <span className="text-kabuki-red font-bold text-[10px] uppercase tracking-[0.3em]">
            {isDelivery ? "Suivi de Livraison" : "Suivi en direct"}
          </span>
          <h2 className="text-white font-display font-bold uppercase text-3xl tracking-tighter italic mt-1">
            #KBK-{order.id}
          </h2>
          <p className="text-gray-400 text-sm mt-2 font-medium">
            {isDelivered ? "Livraison effectuée" : isCancelled ? "Commande annulée" : `Prévu à ${order.pickup_time}`}
          </p>
        </div>

        <AnimatePresence>
          {showMap && !isDelivered && !isCancelled && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8"
            >
              <DeliveryMap driverLat={order.driver_lat} driverLng={order.driver_lng} />
            </motion.div>
          )}
        </AnimatePresence>

        {isCancelled ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="text-center py-10 bg-red-900/10 rounded-2xl border border-red-500/20"
          >
            <XCircle size={48} className="text-kabuki-red mx-auto mb-4" />
            <h3 className="text-white font-bold uppercase tracking-widest mb-2">Commande Annulée</h3>
            <p className="text-gray-400 text-xs px-6 leading-relaxed">
              Cette commande a été annulée. Un remboursement a été initié vers votre moyen de paiement original.
            </p>
          </motion.div>
        ) : (
          <div className="relative mt-4">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-800" />

            <div className="space-y-8">
              {steps.map((step, index) => {
                const isCompleted = index <= activeIndex;
                const isActive = index === activeIndex;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="relative flex items-center gap-6 z-10">
                    <motion.div
                      initial={false}
                      animate={{
                        backgroundColor: isCompleted ? "#DC2626" : "#171717",
                        borderColor: isCompleted ? "#DC2626" : "#262626",
                        color: isCompleted ? "#FFFFFF" : "#525252",
                        scale: isActive ? 1.1 : 1
                      }}
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 ${isActive ? 'shadow-[0_0_20px_rgba(220,38,38,0.4)]' : ''}`}
                    >
                      <Icon size={20} />
                    </motion.div>

                    <div>
                      <h4 className={`text-sm font-bold uppercase tracking-widest ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                        {step.label}
                      </h4>
                      {isActive && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="text-xs text-kabuki-red font-bold mt-1 overflow-hidden"
                        >
                          {step.id === "Payé" ? "En attente de prise en charge." :
                           step.id === "En préparation" ? "Nos chefs préparent vos sushis..." : 
                           step.id === "Prête" && !isDelivery ? "Votre commande est prête !" : 
                           step.id === "Prête" && isDelivery ? "Le livreur est en route vers le restaurant." : 
                           step.id === "En livraison" ? "Regardez la carte, il arrive !" : 
                           step.id === "Livrée" ? "Bon appétit ! Merci de votre confiance." : ""}
                        </motion.p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {(isDelivered || isCancelled) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <Link 
              href={`/${lang}/menu`}
              onClick={handleFinish}
              className="w-full bg-white text-black font-bold py-5 rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-kabuki-red hover:text-white transition-all shadow-xl"
            >
              Nouvelle commande <ArrowRight size={16} />
            </Link>
            
            <Link 
              href={`/${lang}`}
              onClick={handleFinish}
              className="w-full text-center text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] hover:text-white transition-colors py-2"
            >
              {"Retour à l'accueil"}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}