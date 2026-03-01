"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { 
  TrendingUp, ShoppingBag, Users, 
  Loader2, Calendar,
  Trophy, Zap, MapPin, MousePointer2
} from "lucide-react";
import { motion } from "framer-motion";

// ✅ 1. Interfaces strictes pour supprimer les erreurs 'any'
interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
}

interface Order {
  total_amount: number;
  created_at: string;
  order_type: string;
  items: OrderItem[]; 
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
  color: string;
}

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    totalOrders: 0,
    todayOrders: 0,
    averageBasket: 0,
    topProducts: [] as { name: string; quantity: number }[],
    deliverySplit: { delivery: 0, takeaway: 0 }
  });

  const calculateStats = useCallback((orders: Order[]) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let totalRev = 0;
    let todayRev = 0;
    let todayCount = 0;
    let deliveryCount = 0;
    let takeawayCount = 0;
    const productMap: Record<string, number> = {};

    orders.forEach(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      
      totalRev += Number(order.total_amount);
      if (orderDate === todayStr) {
        todayRev += Number(order.total_amount);
        todayCount++;
      }

      if (order.order_type === "Livraison") deliveryCount++;
      else takeawayCount++;

      // ✅ Typage de l'item pour éviter le 'any'
      if (Array.isArray(order.items)) {
        order.items.forEach((item: OrderItem) => {
          productMap[item.name] = (productMap[item.name] || 0) + (item.quantity || 1);
        });
      }
    });

    const topProd = Object.entries(productMap)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    setStats({
      totalRevenue: totalRev,
      todayRevenue: todayRev,
      totalOrders: orders.length,
      todayOrders: todayCount,
      averageBasket: orders.length > 0 ? totalRev / orders.length : 0,
      topProducts: topProd,
      deliverySplit: { delivery: deliveryCount, takeaway: takeawayCount }
    });
  }, []);

  useEffect(() => {
    async function getStats() {
      setLoading(true);
      // ✅ On ne récupère que 'data' pour éviter l'erreur de variable 'error' inutilisée
      const { data } = await supabase
        .from("orders")
        .select("total_amount, created_at, order_type, items")
        .neq("status", "Annulée")
        .neq("status", "Paiement en cours");

      if (data) calculateStats(data as unknown as Order[]);
      setLoading(false);
    }
    getStats();
  }, [calculateStats]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="animate-spin text-kabuki-red" size={32} />
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Analyse des données...</span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-white">
            Performances <span className="text-kabuki-red">Kabuki</span>
          </h1>
          <p className="text-neutral-500 text-sm mt-2 italic">Résumé de votre activité commerciale.</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl flex items-center gap-3">
          <Calendar size={16} className="text-kabuki-red" />
          {/* ✅ Correction de l'apostrophe ici */}
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">{"Aujourd'hui"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="CA Aujourd'hui" 
          value={`${stats.todayRevenue.toFixed(2)} CHF`} 
          icon={<Zap size={20} />} 
          trend={`${stats.todayOrders} commandes`}
          color="text-white"
        />
        <StatCard 
          title="CA Total" 
          value={`${stats.totalRevenue.toFixed(2)} CHF`} 
          icon={<TrendingUp size={20} />} 
          trend="Depuis le lancement"
          color="text-kabuki-red"
        />
        <StatCard 
          title="Panier Moyen" 
          value={`${stats.averageBasket.toFixed(2)} CHF`} 
          icon={<ShoppingBag size={20} />} 
          trend="Par commande"
          color="text-white"
        />
        <StatCard 
          title="Total Commandes" 
          value={stats.totalOrders} 
          icon={<Users size={20} />} 
          trend="Clients servis"
          color="text-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-[32px] p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-kabuki-red/10 rounded-lg"><Trophy size={20} className="text-kabuki-red" /></div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-white">Top 5 des ventes</h2>
          </div>
          <div className="space-y-4">
            {stats.topProducts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-neutral-600 w-4">0{idx + 1}</span>
                  <span className="font-bold text-white uppercase text-sm tracking-tight">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-black">{item.quantity}</span>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Vendus</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-[32px] p-8">
          <h2 className="text-lg font-bold uppercase tracking-widest text-white mb-8">Canaux de vente</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-1">
                <span className="flex items-center gap-2"><MapPin size={12} className="text-blue-400" /> Livraison</span>
                <span className="text-blue-400">{Math.round((stats.deliverySplit.delivery / stats.totalOrders) * 100) || 0}%</span>
              </div>
              <div className="h-3 bg-black rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${(stats.deliverySplit.delivery / stats.totalOrders) * 100}%` }} 
                  className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-1">
                <span className="flex items-center gap-2"><MousePointer2 size={12} className="text-amber-400" /> Click & Collect</span>
                <span className="text-amber-400">{Math.round((stats.deliverySplit.takeaway / stats.totalOrders) * 100) || 0}%</span>
              </div>
              <div className="h-3 bg-black rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${(stats.deliverySplit.takeaway / stats.totalOrders) * 100}%` }} 
                  className="h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ Remplacement du 'any' par StatCardProps
function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[24px] shadow-xl relative overflow-hidden group hover:border-kabuki-red/50 transition-colors">
      <div className="absolute -right-2 -top-2 text-white/5 group-hover:text-kabuki-red/10 transition-colors">
        {icon}
      </div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">{title}</p>
      <h3 className={`text-2xl font-display font-bold ${color} tracking-tight`}>{value}</h3>
      <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 font-medium">
        {trend}
      </p>
    </div>
  );
}