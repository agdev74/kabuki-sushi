"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/utils/supabase/client";
import { 
  Package, User, MapPin, Eye, XCircle, Calendar, CheckCircle2, 
  AlertCircle, ChefHat, Truck, Loader2, RefreshCw, Clock, 
  MessageSquare, Volume2, VolumeX, ShoppingBag 
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
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.wav");
    audioRef.current.load();
    const savedSoundPref = localStorage.getItem("kabuki_admin_sound");
    if (savedSoundPref !== null) setIsSoundEnabled(savedSoundPref === "true");
  }, []);

  const toggleSound = () => {
    const nextState = !isSoundEnabled;
    setIsSoundEnabled(nextState);
    localStorage.setItem("kabuki_admin_sound", String(nextState));
    if (audioRef.current) audioRef.current.play().catch(() => {});
  };

  const playNotification = useCallback(() => {
    if (isSoundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error("Erreur audio :", err));
    }
  }, [isSoundEnabled]);

  const fetchOrders = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .neq("status", "Paiement en cours") 
        .order("created_at", { ascending: false });

      if (data) setOrders(data as Order[]);
      if (error) console.error("Erreur Supabase:", error);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) alert("Erreur de mise à jour");
    else {
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      fetchOrders(); 
    }
  };

  useEffect(() => {
    fetchOrders();
    const subscription = supabase
      .channel("kitchen-monitor")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const isNowPaid = payload.new?.status === "Payé";
        const wasNotPaid = !payload.old || payload.old.status !== "Payé";
        if (isNowPaid && wasNotPaid) playNotification();
        fetchOrders();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        if (payload.new?.status === "Payé") playNotification();
        fetchOrders();
      })
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

  if (loading) return <div className="flex flex-col items-center justify-center p-20 space-y-4"><Loader2 className="animate-spin text-kabuki-red" size={32} /><span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Synchronisation...</span></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800 flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-3">
            <ChefHat className="text-kabuki-red" /> Cuisine
          </h2>
          <button onClick={toggleSound} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all border ${isSoundEnabled ? "bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
            {isSoundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {isSoundEnabled ? "Alertes ON" : "Alertes OFF"}
          </button>
        </div>
        <button onClick={() => fetchOrders(true)} className="flex items-center gap-2 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-gray-400 px-4 py-2 rounded-full uppercase font-bold transition border border-neutral-700">
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => {
            const style = getStatusStyle(order.status);
            const isDelivery = order.order_type === "Livraison";

            return (
              <motion.div 
                key={order.id} 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-wrap md:flex-nowrap items-center justify-between gap-6 hover:border-neutral-700 transition shadow-xl ${(order.status === 'Livrée' || order.status === 'Annulée') ? 'opacity-40 grayscale' : ''}`}
              >
                {/* NUMÉRO ET CLIENT */}
                <div className="flex flex-col gap-2 min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <span className="bg-kabuki-red text-white text-[14px] font-black px-3 py-1 rounded-md shadow-lg italic tracking-tighter">
                      #KBK-{order.id}
                    </span>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase border ${
                      isDelivery ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {isDelivery ? <Truck size={12} /> : <ShoppingBag size={12} />}
                      {order.order_type}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg uppercase leading-tight tracking-tight">{order.customer_name}</h4>
                    {/* ✅ TÉLÉPHONE PLUS LISIBLE (MONO) */}
                    <p className="text-[11px] text-gray-400 font-mono tracking-[0.15em] mt-1 bg-white/5 w-fit px-2 rounded">
                      {order.customer_phone}
                    </p>
                  </div>
                </div>

                {/* ✅ ADRESSE DE LIVRAISON DIRECTE */}
                {isDelivery && (
                  <div className="flex-1 min-w-[200px] max-w-xs bg-blue-500/5 px-4 py-3 rounded-xl border border-blue-500/10">
                    <span className="text-[8px] text-blue-400/60 font-black uppercase tracking-widest mb-1 block">Destination</span>
                    <p className="text-white text-xs font-bold leading-tight">{order.delivery_address}</p>
                    <p className="text-blue-400 text-[10px] font-black mt-1 font-mono tracking-tighter">{order.delivery_zip}</p>
                  </div>
                )}

                {/* CRÉNEAU HORAIRE */}
                <div className="flex flex-col bg-black/40 px-4 py-2 rounded-xl border border-neutral-800/50">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Prévu pour</span>
                  <div className="flex items-center gap-2 text-white font-black text-base">
                    <Clock size={16} className="text-kabuki-red" />
                    {order.pickup_time}
                  </div>
                </div>

                {/* STATUT ET ACTIONS */}
                <div className="flex items-center gap-4">
                  <div className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase flex items-center gap-2 border shadow-inner ${style.bg} ${style.text} ${style.border}`}>
                    {style.icon} {order.status}
                  </div>
                  {style.next && (
                    <button onClick={() => updateStatus(order.id, style.next!)} className="bg-white text-black hover:bg-kabuki-red hover:text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg active:scale-95 flex items-center gap-2">
                      {style.btnIcon} {style.btnLabel}
                    </button>
                  )}
                </div>

                {/* TOTAL ET VUE */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-[8px] text-gray-500 font-bold uppercase tracking-widest">Total</span>
                    <span className="text-base font-black text-white">{Number(order.total_amount).toFixed(2)} <span className="text-[10px] text-kabuki-red">CHF</span></span>
                  </div>
                  <button onClick={() => setSelectedOrder(order)} className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition border border-neutral-700 shadow-lg">
                    <Eye size={20} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-neutral-900 border border-neutral-800 w-full max-w-xl rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              <div className="p-8 border-b border-neutral-800 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-4">
                    <span className="bg-kabuki-red text-white text-lg font-black px-4 py-1 rounded-lg italic">#KBK-{selectedOrder.id}</span>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black uppercase border ${selectedOrder.order_type === "Livraison" ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                        {selectedOrder.order_type}
                    </div>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="bg-neutral-800 p-3 rounded-full text-gray-500 hover:text-white transition"><XCircle size={24}/></button>
              </div>
              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-2"><User size={12}/> Client</span>
                    <p className="text-white text-lg font-bold uppercase">{selectedOrder.customer_name}</p>
                    <p className="text-gray-400 text-sm font-mono tracking-wider">{selectedOrder.customer_phone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-2"><Calendar size={12}/> Créneau</span>
                    <p className="text-white text-lg font-bold">{selectedOrder.pickup_time}</p>
                  </div>
                </div>
                {selectedOrder.order_type === "Livraison" && (
                  <div className="bg-blue-500/5 p-5 rounded-3xl border border-blue-500/10 text-white">
                    <span className="text-[10px] text-blue-400 uppercase font-bold flex items-center gap-2 mb-2"><MapPin size={12}/> Destination</span>
                    <p className="text-base font-bold leading-relaxed">{selectedOrder.delivery_address}, {selectedOrder.delivery_zip}</p>
                  </div>
                )}
                {selectedOrder.comments && (
                  <div className="bg-amber-500/5 p-5 rounded-3xl border border-amber-500/10">
                    <span className="text-[10px] text-amber-500 uppercase font-bold flex items-center gap-2 mb-2"><MessageSquare size={12}/> Instructions & Allergies</span>
                    <p className="text-white text-sm italic leading-relaxed">{"\""}{selectedOrder.comments}{"\""}</p>
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
                        <span className="text-white font-bold uppercase tracking-tight">{item.name}</span>
                      </div>
                      <span className="text-gray-500 font-bold italic">{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-neutral-800 flex flex-col gap-4 mt-auto">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Total</span>
                    <span className="text-3xl font-display font-bold text-white">{Number(selectedOrder.total_amount).toFixed(2)} <span className="text-kabuki-red text-sm uppercase">CHF</span></span>
                  </div>
                  {getStatusStyle(selectedOrder.status).next && (
                    <button onClick={() => updateStatus(selectedOrder.id, getStatusStyle(selectedOrder.status).next!)} className="w-full bg-white text-black py-5 rounded-[20px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-kabuki-red hover:text-white transition-all shadow-2xl">
                      {getStatusStyle(selectedOrder.status).btnIcon} {getStatusStyle(selectedOrder.status).btnLabel}
                    </button>
                  )}
                  {selectedOrder.status !== "Livrée" && selectedOrder.status !== "Annulée" && (
                    <button 
                      onClick={async () => {
                        if (!window.confirm("Annuler et rembourser cette commande ?")) return;
                        try {
                          const res = await fetch('/api/refund-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: selectedOrder.id }) });
                          if (!res.ok) throw new Error("Erreur");
                          updateStatus(selectedOrder.id, "Annulée");
                          setSelectedOrder(null); 
                        } catch {
                          alert("Erreur lors de l'annulation");
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