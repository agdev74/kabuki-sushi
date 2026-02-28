"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Clock,
  MessageSquare,
  Volume2, 
  VolumeX 
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
  comments?: string;
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialisation du son (public/sounds/notification.wav)
    audioRef.current = new Audio("/sounds/notification.wav");
  }, []);

  const playNotification = useCallback(() => {
    if (isSoundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log("Lecture audio bloquée :", err));
    }
  }, [isSoundEnabled]);

  const fetchOrders = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        // ✅ On masque les commandes qui n'ont pas encore fini le paiement Stripe
        .neq("status", "Paiement en cours") 
        .order("created_at", { ascending: false });

      if (data) setOrders(data as Order[]);
      if (error) console.error(error);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      alert("Erreur de mise à jour");
    } else {
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      fetchOrders(); 
    }
  };

  useEffect(() => {
    fetchOrders();

    const subscription = supabase
      .channel("kitchen-orders-realtime")
      .on(
        "postgres_changes", 
        { event: "UPDATE", schema: "public", table: "orders" }, 
        (payload) => {
          // ✅ LOGIQUE DE NOTIFICATION :
          // Si une commande passe de "Paiement en cours" à "Payé", on déclenche l'alerte
          if (payload.old?.status === "Paiement en cours" && payload.new?.status === "Payé") {
            playNotification();
          }
          fetchOrders();
        }
      )
      .on(
        "postgres_changes", 
        { event: "INSERT", schema: "public", table: "orders" }, 
        () => {
          // On rafraîchit la liste (elle restera filtrée si le statut est "Paiement en cours")
          fetchOrders();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [fetchOrders, playNotification]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Payé": return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", icon: <AlertCircle size={10} />, next: "En préparation", btnLabel: "Accepter", btnIcon: <ChefHat size={14} /> };
      case "En préparation": return { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", icon: <ChefHat size={10} />, next: "Prête", btnLabel: "Prête", btnIcon: <CheckCircle2 size={14} /> };
      case "Prête": return { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", icon: <Truck size={10} />, next: "Livrée", btnLabel: "Livrée", btnIcon: <Package size={14} /> };
      case "Livrée": return { bg: "bg-neutral-800/50", text: "text-gray-500", border: "border-neutral-800", icon: <CheckCircle2 size={10} />, next: null, btnLabel: "", btnIcon: null };
      case "Annulée": return { bg: "bg-red-900/20", text: "text-red-500", border: "border-red-900/30", icon: <XCircle size={10} />, next: null, btnLabel: "", btnIcon: null };
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
      <div className="flex justify-between items-center bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800 flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-3">
            <ChefHat className="text-kabuki-red" /> Cuisine en Direct
          </h2>

          <button 
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all border ${
              isSoundEnabled 
                ? "bg-green-500/10 border-green-500/30 text-green-500" 
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {isSoundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {isSoundEnabled ? "Alertes Sonores : ON" : "Alertes Sonores : OFF"}
          </button>
        </div>

        <button onClick={() => fetchOrders(true)} className="flex items-center gap-2 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-gray-400 px-4 py-2 rounded-full uppercase font-bold transition border border-neutral-700">
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => {
          const style = getStatusStyle(order.status);
          return (
            <motion.div 
              key={order.id} 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-wrap md:flex-nowrap items-center justify-between gap-6 hover:border-neutral-700 transition shadow-xl ${(order.status === 'Livrée' || order.status === 'Annulée') ? 'opacity-40 grayscale' : ''}`}
            >
              <div className="min-w-[140px]">
                <span className="text-[10px] font-bold text-kabuki-red uppercase tracking-tighter">#KBK-{order.id}</span>
                <h4 className="text-white font-bold text-base uppercase leading-tight">{order.customer_name}</h4>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{order.order_type}</span>
              </div>

              <div className="flex flex-col text-sm text-white font-bold">
                <div className="flex items-center gap-2"><Calendar size={14} className="text-kabuki-red" /> {order.pickup_time}</div>
              </div>

              <div className="flex items-center gap-4 bg-black/30 p-2 rounded-2xl border border-neutral-800/50">
                <div className={`text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase flex items-center gap-2 border ${style.bg} ${style.text} ${style.border}`}>
                  {style.icon} {order.status}
                </div>
                {style.next && (
                  <button onClick={() => updateStatus(order.id, style.next!)} className="bg-white text-black hover:bg-kabuki-red hover:text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg active:scale-95">
                    {style.btnIcon} {style.btnLabel}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right mr-4">
                  <span className="text-sm font-bold text-white">{Number(order.total_amount).toFixed(2)} CHF</span>
                </div>
                <button onClick={() => setSelectedOrder(order)} className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition border border-neutral-700">
                  <Eye size={18} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-neutral-900 border border-neutral-800 w-full max-w-xl rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              
              <div className="p-8 border-b border-neutral-800 flex justify-between items-center bg-white/5">
                <h3 className="text-white font-display font-bold uppercase text-2xl">#KBK-{selectedOrder.id}</h3>
                <button onClick={() => setSelectedOrder(null)} className="bg-neutral-800 p-3 rounded-full text-gray-500 hover:text-white transition"><XCircle size={24}/></button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-2"><User size={12}/> Client</span>
                    <p className="text-white text-lg font-bold uppercase">{selectedOrder.customer_name}</p>
                    <p className="text-gray-400 text-sm">{selectedOrder.customer_phone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-2"><Calendar size={12}/> Créneau</span>
                    <p className="text-white text-lg font-bold">{selectedOrder.pickup_time}</p>
                    <p className="text-kabuki-red text-[10px] font-bold uppercase">{selectedOrder.order_type}</p>
                  </div>
                </div>

                {selectedOrder.order_type === "Livraison" && (
                  <div className="bg-blue-500/5 p-5 rounded-3xl border border-blue-500/10 text-white">
                    <span className="text-[10px] text-blue-400 uppercase font-bold flex items-center gap-2 mb-2"><MapPin size={12}/> Destination</span>
                    <p className="text-base font-bold">{selectedOrder.delivery_address}, {selectedOrder.delivery_zip}</p>
                  </div>
                )}

                {selectedOrder.comments && (
                  <div className="bg-amber-500/5 p-5 rounded-3xl border border-amber-500/10">
                    <span className="text-[10px] text-amber-500 uppercase font-bold flex items-center gap-2 mb-2">
                      <MessageSquare size={12}/> Instructions & Allergies
                    </span>
                    <p className="text-white text-sm italic leading-relaxed">
                      {"\""}{selectedOrder.comments}{"\""}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2 text-[10px] text-gray-500 uppercase font-bold">
                    <span className="flex items-center gap-2"><Package size={12}/> Contenu</span>
                    <span>{selectedOrder.items.length} articles</span>
                  </div>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 text-sm">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center font-black text-kabuki-red">{item.quantity}</span>
                        <span className="text-white font-bold uppercase">{item.name}</span>
                      </div>
                      <span className="text-gray-500">{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-neutral-800 flex flex-col gap-4 mt-auto">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Total</span>
                    <span className="text-3xl font-display font-bold text-white">{Number(selectedOrder.total_amount).toFixed(2)} <span className="text-kabuki-red text-sm">CHF</span></span>
                  </div>
                  {getStatusStyle(selectedOrder.status).next && (
                    <button onClick={() => updateStatus(selectedOrder.id, getStatusStyle(selectedOrder.status).next!)} className="w-full bg-white text-black py-5 rounded-[20px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-kabuki-red hover:text-white transition-all shadow-2xl">
                      {getStatusStyle(selectedOrder.status).btnIcon} {getStatusStyle(selectedOrder.status).btnLabel}
                    </button>
                  )}
                  {selectedOrder.status !== "Livrée" && selectedOrder.status !== "Annulée" && (
                    <button 
                      onClick={async () => {
                        if (!window.confirm("Annuler et rembourser ?")) return;
                        try {
                          const res = await fetch('/api/refund-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: selectedOrder.id }) });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error);
                          updateStatus(selectedOrder.id, "Annulée");
                          setSelectedOrder(null); 
                        } catch (error) {
                          alert(error instanceof Error ? error.message : "Erreur");
                        }
                      }}
                      className="w-full text-gray-500 hover:text-red-500 py-3 font-bold uppercase text-[10px] flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-red-900/50 rounded-xl"
                    >
                      <XCircle size={14} /> Annuler et rembourser
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