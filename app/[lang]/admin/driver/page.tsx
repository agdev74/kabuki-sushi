"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Truck, MapPin, CheckCircle2, Navigation, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Order {
  id: number;
  customer_name: string;
  delivery_address: string;
  delivery_zip: string;
  customer_phone: string;
  status: string;
  total_amount: number;
}

export default function DriverDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeliveryId, setActiveDeliveryId] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);

  // ✅ 1. Déclaration AVANT le useEffect, avec useCallback pour stabiliser la fonction
  const fetchDriverOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_type", "Livraison")
      .in("status", ["Prête", "En livraison"])
      .order("id", { ascending: true });

    if (error) {
      console.error("Erreur chargement livraisons:", error);
    } else if (data) {
      setOrders(data as Order[]);
      const active = data.find(o => o.status === "En livraison");
      if (active) setActiveDeliveryId(active.id);
    }
    setLoading(false);
  }, []);

  // ✅ 2. Le useEffect vient ENSUITE
  useEffect(() => {
    // On indique à ESLint que ce comportement est voulu
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDriverOrders();

    const subscription = supabase
      .channel("driver-monitor")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => {
        fetchDriverOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [fetchDriverOrders]);

  const startDelivery = async (orderId: number) => {
    if (!navigator.geolocation) {
      setGeoError("Le GPS n'est pas supporté par ce navigateur.");
      return;
    }

    setGeoError(null);

    await supabase.from("orders").update({ status: "En livraison" }).eq("id", orderId);
    setActiveDeliveryId(orderId);
    fetchDriverOrders();

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`📍 Position MAJ : ${latitude}, ${longitude}`);
        
        await supabase
          .from("orders")
          .update({ driver_lat: latitude, driver_lng: longitude })
          .eq("id", orderId);
      },
      (error) => {
        setGeoError("Veuillez autoriser l'accès au GPS pour le suivi.");
        console.error("Erreur GPS:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  };

  const endDelivery = async (orderId: number) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    await supabase
      .from("orders")
      .update({ 
        status: "Livrée", 
        driver_lat: null, 
        driver_lng: null 
      })
      .eq("id", orderId);

    setActiveDeliveryId(null);
    fetchDriverOrders();
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-kabuki-red" size={40} /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24">
      <div className="mb-6 pt-4">
        <h1 className="text-2xl font-display font-bold uppercase flex items-center gap-3 tracking-widest text-white">
          <Truck className="text-kabuki-red" size={28} /> Espace Livreur
        </h1>
        <p className="text-gray-500 text-xs mt-1 uppercase font-bold tracking-widest">
          {orders.length} livraison(s) en attente
        </p>
      </div>

      {geoError && (
        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-2xl mb-6 flex items-start gap-3 text-red-400 text-sm">
          <AlertTriangle size={20} className="shrink-0" />
          <p>{geoError}</p>
        </div>
      )}

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => {
            const isTrackingMe = activeDeliveryId === order.id;

            return (
              <motion.div 
                key={order.id} 
                layout 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-3xl border transition-all duration-500 flex flex-col ${
                  isTrackingMe 
                    ? "bg-kabuki-red/10 border-kabuki-red shadow-[0_0_30px_rgba(220,38,38,0.2)]" 
                    : "bg-neutral-900 border-neutral-800"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-white text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      #KBK-{order.id}
                    </span>
                    <h2 className="text-xl font-bold uppercase mt-2">{order.customer_name}</h2>
                    <a href={`tel:${order.customer_phone}`} className="text-blue-400 text-sm font-mono mt-1 block hover:underline">
                      📞 {order.customer_phone}
                    </a>
                  </div>
                  <span className="font-display font-bold text-xl">{order.total_amount.toFixed(2)} CHF</span>
                </div>

                <div className="bg-black/50 p-4 rounded-2xl border border-white/5 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-gray-500 mt-0.5 shrink-0" size={18} />
                    <div>
                      <p className="font-bold text-sm leading-tight">{order.delivery_address}</p>
                      <p className="text-kabuki-red font-black text-xs mt-1">{order.delivery_zip}</p>
                    </div>
                  </div>
                  
                  {/* ✅ Lien Google Maps corrigé pour une ouverture direct dans l'app sur mobile */}
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery_address + ', ' + order.delivery_zip + ', Suisse')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 w-full bg-neutral-800 hover:bg-neutral-700 py-3 rounded-xl text-xs font-bold uppercase transition"
                  >
                    <Navigation size={14} /> Ouvrir le GPS
                  </a>
                </div>

                <div className="mt-auto">
                  {isTrackingMe ? (
                    <button 
                      onClick={() => endDelivery(order.id)}
                      className="w-full py-4 rounded-xl bg-green-600 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-green-500 transition-all active:scale-95"
                    >
                      <CheckCircle2 size={20} /> Livraison Terminée
                    </button>
                  ) : (
                    <button 
                      onClick={() => startDelivery(order.id)}
                      disabled={activeDeliveryId !== null}
                      className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        activeDeliveryId !== null 
                          ? "bg-neutral-800 text-gray-600 cursor-not-allowed" 
                          : "bg-kabuki-red text-white shadow-lg hover:bg-red-700 shadow-red-900/30"
                      }`}
                    >
                      <Navigation size={20} /> Démarrer la course
                    </button>
                  )}
                  
                  {isTrackingMe && (
                    <p className="text-center text-[10px] text-kabuki-red uppercase font-bold mt-4 animate-pulse tracking-widest">
                      📍 Partage GPS en direct activé...
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {orders.length === 0 && (
          <div className="text-center text-gray-500 py-20 uppercase font-bold text-sm tracking-widest border border-dashed border-neutral-800 rounded-3xl">
            Aucune livraison prête.
          </div>
        )}
      </div>
    </div>
  );
}