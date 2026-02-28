"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { 
  Package, 
  User, 
  MapPin, 
  Eye, 
  XCircle, 
  Calendar,
  CheckCircle2, 
  AlertCircle,
  ChefHat,
  Truck,
  Loader2,
  RefreshCw,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OrderItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  pickup_date: string;
  pickup_time: string;
  order_type: string;
  total_amount: number;
  items: OrderItem[]; 
  status: string;
  delivery_address?: string;
  delivery_zip?: string;
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 1. Fonction de récupération des données
  const fetchOrders = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        // ✅ SUPPRIMÉ : .neq("status", "Terminée") pour afficher TOUTES les commandes
        .order("created_at", { ascending: false });

      if (data) setOrders(data as Order[]);
      if (error) console.error(error);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Mise à jour du statut
  const updateStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      alert("Erreur de mise à jour");
    } else {
      // Si la modale est ouverte pour cette commande, on met à jour la modale aussi
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      fetchOrders(); // Rafraîchissement léger
    }
  };

  // 3. Temps Réel & Chargement Initial
  useEffect(() => {
    fetchOrders();

    const subscription = supabase
      .channel("orders-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [fetchOrders]);

  // Configuration visuelle des statuts
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Payé": return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", icon: <AlertCircle size={10} />, next: "En préparation", btnLabel: "Accepter", btnIcon: <ChefHat size={14} /> };
      case "En préparation": return { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", icon: <ChefHat size={10} />, next: "Prête", btnLabel: "Prête", btnIcon: <CheckCircle2 size={14} /> };
      // ✅ "Prête" mène maintenant vers "Livrée"
      case "Prête": return { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", icon: <Truck size={10} />, next: "Livrée", btnLabel: "Livrée", btnIcon: <Package size={14} /> };
      // ✅ Configuration pour "Livrée" (Archive)
      case "Livrée": return { bg: "bg-neutral-800/50", text: "text-gray-500", border: "border-neutral-800", icon: <CheckCircle2 size={10} />, next: null, btnLabel: "", btnIcon: null };
      default: return { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20", icon: <Clock size={10} />, next: null, btnLabel: "", btnIcon: null };
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="animate-spin text-kabuki-red" size={32} />
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Synchronisation...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800">
        <h2 className="text-xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-3">
          <ChefHat className="text-kabuki-red" /> Cuisine en Direct
        </h2>
        <button onClick={() => fetchOrders(true)} className="flex items-center gap-2 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-gray-400 px-4 py-2 rounded-full uppercase font-bold transition border border-neutral-700">
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      {/* Liste des commandes */}
      <div className="grid gap-4">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
            <p className="text-gray-600 text-sm uppercase tracking-widest italic">Le calme avant la tempête...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {orders.map((order) => {
              const style = getStatusStyle(order.status);
              return (
                <motion.div 
                  key={order.id} 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  // ✅ Effet visuel si Livrée (transparence + noir&blanc)
                  className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-wrap md:flex-nowrap items-center justify-between gap-6 hover:border-neutral-700 transition shadow-xl ${order.status === 'Livrée' ? 'opacity-40 grayscale' : ''}`}
                >
                  {/* Numéro & Client */}
                  <div className="min-w-[140px]">
                    <span className="text-[10px] font-bold text-kabuki-red uppercase tracking-tighter">#KBK-{order.id}</span>
                    <h4 className="text-white font-bold text-base uppercase leading-tight">{order.customer_name}</h4>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{order.order_type}</span>
                  </div>

                  {/* Horaire */}
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase font-bold mb-1">Heure de retrait</span>
                    <div className="flex items-center gap-2 text-sm text-white font-bold">
                      <Calendar size={14} className="text-kabuki-red" />
                      {order.pickup_time}
                    </div>
                  </div>

                  {/* Statut & Action Rapide */}
                  <div className="flex items-center gap-4 bg-black/30 p-2 rounded-2xl border border-neutral-800/50">
                    <div className={`text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase flex items-center gap-2 border ${style.bg} ${style.text} ${style.border}`}>
                      {style.icon} {order.status}
                    </div>
                    
                    {style.next && (
                      <button 
                        onClick={() => updateStatus(order.id, style.next!)}
                        className="flex items-center gap-2 bg-white text-black hover:bg-kabuki-red hover:text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg active:scale-95"
                      >
                        {style.btnIcon} {style.btnLabel}
                      </button>
                    )}
                  </div>

                  {/* Actions de vue */}
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                        <span className="block text-[9px] text-gray-500 uppercase font-bold">Total</span>
                        <span className="text-sm font-bold text-white">{Number(order.total_amount).toFixed(2)} CHF</span>
                    </div>
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition border border-neutral-700"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* --- MODALE DÉTAILS --- */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-neutral-900 border border-neutral-800 w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              
              {/* Header Modale */}
              <div className="p-8 border-b border-neutral-800 flex justify-between items-center bg-white/5">
                <div className="space-y-1">
                  <span className="text-kabuki-red font-bold text-[10px] uppercase tracking-[0.3em]">Commande en cours</span>
                  <h3 className="text-white font-display font-bold uppercase text-2xl tracking-tighter italic">#KBK-{selectedOrder.id}</h3>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="bg-neutral-800 p-3 rounded-full text-gray-500 hover:text-white transition"><XCircle size={24}/></button>
              </div>

              {/* Contenu Modale */}
              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Client & Infos */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-2"><User size={12}/> Client</span>
                    <p className="text-white text-lg font-bold uppercase">{selectedOrder.customer_name}</p>
                    <p className="text-gray-400 text-sm font-medium">{selectedOrder.customer_phone}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-2"><Calendar size={12}/> Créneau</span>
                    <p className="text-white text-lg font-bold">{selectedOrder.pickup_time}</p>
                    <p className="text-kabuki-red text-[10px] font-bold uppercase tracking-widest">{selectedOrder.order_type}</p>
                  </div>
                </div>

                {/* Adresse */}
                {selectedOrder.order_type === "Livraison" && (
                  <div className="bg-blue-500/5 p-5 rounded-3xl border border-blue-500/10">
                    <span className="text-[10px] text-blue-400 uppercase font-bold flex items-center gap-2 mb-2"><MapPin size={12}/> Destination</span>
                    <p className="text-white text-base leading-relaxed font-bold">{selectedOrder.delivery_address}, {selectedOrder.delivery_zip}</p>
                  </div>
                )}

                {/* Liste Articles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-2"><Package size={12}/> Contenu du plateau</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">{selectedOrder.items.length} articles</span>
                  </div>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center text-xs font-black text-kabuki-red">{item.quantity}</div>
                          <span className="text-white text-sm font-bold uppercase tracking-tight">{item.name}</span>
                        </div>
                        <span className="text-gray-500 font-bold text-sm">{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions de changement de statut dans la modale */}
                <div className="pt-6 border-t border-neutral-800 flex flex-col gap-4">
                    <div className="flex justify-between items-center px-2">
                       <span className="text-gray-500 font-bold uppercase text-[10px]">Total de la commande</span>
                       <span className="text-3xl font-display font-bold text-white">{Number(selectedOrder.total_amount).toFixed(2)} <span className="text-kabuki-red text-sm">CHF</span></span>
                    </div>
                    
                    {/* Bouton d'action géant dans la modale */}
                    {getStatusStyle(selectedOrder.status).next && (
                      <button 
                        onClick={() => updateStatus(selectedOrder.id, getStatusStyle(selectedOrder.status).next!)}
                        className="w-full bg-white text-black py-5 rounded-[20px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-kabuki-red hover:text-white transition-all shadow-2xl"
                      >
                        {getStatusStyle(selectedOrder.status).btnIcon}
                        {getStatusStyle(selectedOrder.status).btnLabel}
                      </button>
                    )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}