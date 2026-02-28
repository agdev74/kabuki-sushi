"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { motion } from "framer-motion";
import { Receipt, ChefHat, Package, CheckCircle2, Loader2 } from "lucide-react"; // ❌ AlertCircle retiré

// ✅ 1. Définition du type pour remplacer "any"
interface OrderData {
  id: number;
  pickup_time: string;
  status: string;
}

interface OrderTrackerProps {
  orderId: number;
}

export default function OrderTracker({ orderId }: OrderTrackerProps) {
  const [order, setOrder] = useState<OrderData | null>(null); // ✅ Type corrigé
  const [loading, setLoading] = useState(true);

  // Les étapes de préparation
  const steps = [
    { id: "Payé", label: "Commande validée", icon: Receipt },
    { id: "En préparation", label: "En cuisine", icon: ChefHat },
    { id: "Prête", label: "Prête", icon: Package },
    { id: "Livrée", label: "Terminée", icon: CheckCircle2 }
  ];

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, pickup_time, status")
        .eq("id", orderId)
        .single();

      if (error) {
        console.error("Erreur lors du chargement de la commande:", error); // ✅ Erreur utilisée
      } else if (data) {
        setOrder(data as OrderData);
      }
      setLoading(false);
    };

    fetchOrder();

    // 🔴 Écoute des changements en direct !
    const subscription = supabase
      .channel(`public:orders:id=eq.${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(payload.new as OrderData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [orderId]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-kabuki-red" /></div>;
  if (!order) return <div className="text-center p-10 text-gray-500 font-bold uppercase tracking-widest text-sm">Commande introuvable</div>;

  // Calcul de l'étape actuelle
  const currentStepIndex = steps.findIndex(s => s.id === order.status);
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-lg mx-auto shadow-2xl">
      <div className="text-center mb-10">
        <span className="text-kabuki-red font-bold text-[10px] uppercase tracking-[0.3em]">Suivi en direct</span>
        <h2 className="text-white font-display font-bold uppercase text-3xl tracking-tighter italic mt-1">
          Commande #KBK-{order.id}
        </h2>
        <p className="text-gray-400 text-sm mt-2 font-medium">
          Retrait prévu à <span className="text-white font-bold">{order.pickup_time}</span>
        </p>
      </div>

      <div className="relative">
        {/* Ligne de fond */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-800" />

        <div className="space-y-8">
          {steps.map((step, index) => {
            const isCompleted = index <= activeIndex;
            const isActive = index === activeIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative flex items-center gap-6 z-10">
                {/* Bulle Icône */}
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

                {/* Texte */}
                <div>
                  <h4 className={`text-sm font-bold uppercase tracking-widest ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                    {step.label}
                  </h4>
                  {isActive && (
                    <motion.p 
                      // ✅ 2. "h" remplacé par "height"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-xs text-kabuki-red font-bold mt-1 overflow-hidden"
                    >
                      {step.id === "En préparation" ? "Nos chefs préparent vos sushis..." : 
                       step.id === "Prête" ? "Votre commande vous attend !" : 
                       "En attente de prise en charge."}
                    </motion.p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}