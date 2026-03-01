"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { 
  TrendingUp, ShoppingBag, Users, 
  Loader2,
  Trophy, Zap, MapPin, MousePointer2,
  Download, ChevronLeft, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthRevenue: 0,
    totalOrders: 0,
    monthOrders: 0,
    averageBasket: 0,
    topProducts: [] as { name: string; quantity: number }[],
    deliverySplit: { delivery: 0, takeaway: 0 }
  });

  const [allOrders, setAllOrders] = useState<Order[]>([]);

  // Génération du nom du mois pour l'affichage
  const monthLabel = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const calculateStats = useCallback((orders: Order[]) => {
    const selectedMonth = currentDate.getMonth();
    const selectedYear = currentDate.getFullYear();

    let totalRev = 0;
    let monthRev = 0;
    let monthCount = 0;
    let deliveryCount = 0;
    let takeawayCount = 0;
    const productMap: Record<string, number> = {};

    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const isThisMonth = orderDate.getMonth() === selectedMonth && orderDate.getFullYear() === selectedYear;
      
      totalRev += Number(order.total_amount);

      if (isThisMonth) {
        monthRev += Number(order.total_amount);
        monthCount++;
        
        if (order.order_type === "Livraison") deliveryCount++;
        else takeawayCount++;

        if (Array.isArray(order.items)) {
          order.items.forEach((item: OrderItem) => {
            productMap[item.name] = (productMap[item.name] || 0) + (item.quantity || 1);
          });
        }
      }
    });

    const topProd = Object.entries(productMap)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    setStats({
      totalRevenue: totalRev,
      monthRevenue: monthRev,
      totalOrders: orders.length,
      monthOrders: monthCount,
      averageBasket: monthCount > 0 ? monthRev / monthCount : 0,
      topProducts: topProd,
      deliverySplit: { delivery: deliveryCount, takeaway: takeawayCount }
    });
  }, [currentDate]);

  useEffect(() => {
    async function getStats() {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("total_amount, created_at, order_type, items")
        .neq("status", "Annulée")
        .neq("status", "Paiement en cours");

      if (data) {
        setAllOrders(data as unknown as Order[]);
        calculateStats(data as unknown as Order[]);
      }
      setLoading(false);
    }
    getStats();
  }, [calculateStats]);

  // Fonction pour exporter en CSV (Archivage)
  const exportToCSV = () => {
    const selectedMonth = currentDate.getMonth();
    const selectedYear = currentDate.getFullYear();
    
    const monthData = allOrders.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const csvRows = [
      ["Date", "Type", "Montant (CHF)", "Articles"],
      ...monthData.map(o => [
        new Date(o.created_at).toLocaleDateString('fr-FR'),
        o.order_type,
        o.total_amount,
        o.items.map(i => `${i.quantity}x ${i.name}`).join(" | ")
      ])
    ];

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Kabuki_Rapport_${monthLabel.replace(' ', '_')}.csv`;
    link.click();
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="animate-spin text-kabuki-red" size={32} />
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Chargement du rapport...</span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 text-white">
      {/* HEADER AVEC SÉLECTEUR DE MOIS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest">
            Rapports <span className="text-kabuki-red">Mensuels</span>
          </h1>
          <div className="flex items-center gap-4 mt-4 bg-neutral-900 border border-neutral-800 p-2 rounded-2xl w-fit">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-neutral-800 rounded-xl transition-colors"><ChevronLeft size={18} /></button>
            <span className="text-xs font-black uppercase tracking-widest min-w-[140px] text-center">{monthLabel}</span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-neutral-800 rounded-xl transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>

        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-kabuki-red hover:text-white transition-all shadow-xl"
        >
          <Download size={16} /> Archiver ce mois (CSV)
        </button>
      </div>

      {/* KPI CARDS DU MOIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="CA du Mois" 
          value={`${stats.monthRevenue.toFixed(2)} CHF`} 
          icon={<Zap size={20} />} 
          trend={`${stats.monthOrders} commandes`}
          color="text-kabuki-red"
        />
        <StatCard 
          title="Panier Moyen" 
          value={`${stats.averageBasket.toFixed(2)} CHF`} 
          icon={<ShoppingBag size={20} />} 
          trend="Sur ce mois"
          color="text-white"
        />
        <StatCard 
          title="CA Annuel / Total" 
          value={`${stats.totalRevenue.toFixed(2)} CHF`} 
          icon={<TrendingUp size={20} />} 
          trend="Depuis le début"
          color="text-white"
        />
        <StatCard 
          title="Total Commandes" 
          value={stats.totalOrders} 
          icon={<Users size={20} />} 
          trend="Historique complet"
          color="text-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-[32px] p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-kabuki-red/10 rounded-lg"><Trophy size={20} className="text-kabuki-red" /></div>
            <h2 className="text-lg font-bold uppercase tracking-widest">Top 5 ce mois</h2>
          </div>
          <div className="space-y-4">
            {stats.topProducts.length > 0 ? stats.topProducts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-neutral-600 w-4">0{idx + 1}</span>
                  <span className="font-bold uppercase text-sm tracking-tight">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black">{item.quantity}</span>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Vendus</span>
                </div>
              </div>
            )) : <p className="text-gray-500 text-sm italic">Aucune donnée pour ce mois.</p>}
          </div>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-[32px] p-8">
          <h2 className="text-lg font-bold uppercase tracking-widest mb-8">Canaux du mois</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                <span className="flex items-center gap-2 text-blue-400"><MapPin size={12} /> Livraison</span>
                <span>{stats.monthOrders > 0 ? Math.round((stats.deliverySplit.delivery / stats.monthOrders) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${stats.monthOrders > 0 ? (stats.deliverySplit.delivery / stats.monthOrders) * 100 : 0}%` }} 
                  className="h-full bg-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                <span className="flex items-center gap-2 text-amber-400"><MousePointer2 size={12} /> Click & Collect</span>
                <span>{stats.monthOrders > 0 ? Math.round((stats.deliverySplit.takeaway / stats.monthOrders) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${stats.monthOrders > 0 ? (stats.deliverySplit.takeaway / stats.monthOrders) * 100 : 0}%` }} 
                  className="h-full bg-amber-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-[24px] shadow-xl relative overflow-hidden group hover:border-kabuki-red/50 transition-colors">
      <div className="absolute -right-2 -top-2 text-white/5 group-hover:text-kabuki-red/10 transition-colors">
        {icon}
      </div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">{title}</p>
      <h3 className={`text-2xl font-display font-bold ${color} tracking-tight`}>{value}</h3>
      <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 font-medium">{trend}</p>
    </div>
  );
}