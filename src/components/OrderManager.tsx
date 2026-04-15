"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChefHat, Truck, PackageCheck, Loader2, ShoppingBasket } from "lucide-react";

interface OrderItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  customer_name: string;
  total_amount: number;
  status: string;
  items: OrderItem[];
  pickup_time: string;
  order_type: string;
  created_at: string;
}

export default function OrderManager() {
  // ✅ CORRECTION : On utilise useMemo (ou useState) pour garder la même instance 
  // de Supabase entre chaque rendu du composant.
  const supabase = useMemo(() => createClient(), []);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .neq("status", "Terminée")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data as Order[]);
      }
      setLoading(false);
    };

    syncOrders();

    const subscription = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          syncOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [supabase]); // Maintenant, supabase ne change jamais, donc pas de boucle !

  const updateStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) alert("Erreur lors de la mise à jour");
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Payé": return { color: "bg-blue-500", icon: <PackageCheck size={18} />, next: "En préparation", label: "Accepter" };
      case "En préparation": return { color: "bg-orange-500", icon: <ChefHat size={18} />, next: "Prête", label: "Prête" };
      case "Prête": return { color: "bg-green-500", icon: <Truck size={18} />, next: "Terminée", label: "Livrée / Récupérée" };
      default: return { color: "bg-gray-500", icon: <Clock size={18} />, next: null, label: "En attente" };
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-kabuki-red" size={40} /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <header className="flex justify-between items-center mb-10 border-b border-neutral-800 pb-6">
        <h2 className="text-2xl font-display font-bold text-white uppercase tracking-widest">
          Cuisine <span className="text-kabuki-red">Live</span>
        </h2>
        <div className="flex items-center gap-2 bg-neutral-900 px-4 py-2 rounded-full border border-neutral-800">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {orders.length} {orders.length > 1 ? "commandes actives" : "commande active"}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => {
            const config = getStatusConfig(order.status);
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter text-white ${config.color}`}>
                        {order.status}
                      </span>
                      <span className="text-gray-600 text-xs font-mono font-bold">#KBK-{order.id}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">{order.customer_name}</h3>
                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                       <span className="flex items-center gap-1.5 text-kabuki-red"><Clock size={14} /> {order.pickup_time}</span>
                       <span className="text-gray-500 px-2 py-0.5 border border-neutral-800 rounded">{order.order_type}</span>
                    </div>
                  </div>

                  <div className="flex-1 bg-black/40 p-5 rounded-2xl border border-neutral-800/50 min-w-[300px]">
                    <ul className="space-y-2">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-300 font-medium">
                            <span className="text-kabuki-red font-bold mr-2">{item.quantity}x</span> {item.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col items-end gap-3 min-w-[180px]">
                    <div className="text-2xl font-display font-bold text-white">
                      {order.total_amount.toFixed(2)} <span className="text-xs text-gray-500">CHF</span>
                    </div>
                    
                    {config.next && (
                      <button
                        onClick={() => updateStatus(order.id, config.next!)}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-kabuki-red hover:text-white transition-all px-4 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                      >
                        {config.icon}
                        {config.label}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {orders.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
            <ShoppingBasket size={48} className="mx-auto mb-4 text-neutral-800" />
            <p className="uppercase tracking-[0.3em] text-[10px] font-bold text-neutral-600">Le calme avant la tempête...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}