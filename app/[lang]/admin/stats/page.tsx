"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  TrendingUp, ShoppingBag, 
  Loader2, Calendar,
  Trophy, Zap, MapPin, MousePointer2,
  Download, ArrowRight, ArrowDownRight
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
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    rangeRevenueBrut: 0, 
    rangeRevenueNet: 0,  
    rangeFees: 0,        
    totalOrdersCount: 0,
    rangeOrdersCount: 0,
    averageBasket: 0,
    topProducts: [] as { name: string; quantity: number }[],
    deliverySplit: { delivery: 0, takeaway: 0 }
  });

  const [allOrders, setAllOrders] = useState<Order[]>([]);

  const calculateStats = useCallback((orders: Order[]) => {
    // ✅ CORRECTION SAFARI : Forcer le format ISO strict pour éviter les décalages de fuseaux horaires
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    const STRIPE_PERCENT = 0.029;
    const STRIPE_FIXED = 0.30;

    let totalRev = 0;
    let rangeRevBrut = 0;
    let rangeRevNet = 0;
    let rangeFeesAccumulator = 0;
    let rangeCount = 0;
    let deliveryCount = 0;
    let takeawayCount = 0;
    const productMap: Record<string, number> = {};

    orders.forEach(order => {
      // ✅ CORRECTION SAFARI : Remplacer l'espace par un 'T' pour la norme ISO 8601
      const safeDateStr = order.created_at ? order.created_at.replace(' ', 'T') : '';
      const orderDate = new Date(safeDateStr);
      
      // ✅ CORRECTION SÉCURITÉ : Fallback à 0 si total_amount est null
      const amount = Number(order.total_amount || 0);
      
      totalRev += amount;

      if (orderDate >= start && orderDate <= end) {
        rangeRevBrut += amount;
        rangeCount++;
        
        if (amount > 0) {
          const orderFee = (amount * STRIPE_PERCENT) + STRIPE_FIXED;
          rangeFeesAccumulator += orderFee;
          rangeRevNet += (amount - orderFee);
        }

        if (order.order_type === "Livraison") deliveryCount++;
        else takeawayCount++;

        if (Array.isArray(order.items)) {
          order.items.forEach((item: OrderItem) => {
            // ✅ CORRECTION SÉCURITÉ : Gérer les noms de produits potentiellement nulls
            const productName = item.name || 'Produit Inconnu';
            productMap[productName] = (productMap[productName] || 0) + (item.quantity || 1);
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
      rangeRevenueBrut: rangeRevBrut,
      rangeRevenueNet: rangeRevNet,
      rangeFees: rangeFeesAccumulator,
      totalOrdersCount: orders.length,
      rangeOrdersCount: rangeCount,
      averageBasket: rangeCount > 0 ? rangeRevBrut / rangeCount : 0,
      topProducts: topProd,
      deliverySplit: { delivery: deliveryCount, takeaway: takeawayCount }
    });
  }, [startDate, endDate]);

  useEffect(() => {
    async function getStats() {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("total_amount, created_at, order_type, items")
        .neq("status", "Annulée")
        .neq("status", "Paiement en cours");

      if (data) {
        const typedData = data as unknown as Order[];
        setAllOrders(typedData);
        calculateStats(typedData);
      }
      setLoading(false);
    }
    getStats();
  }, [calculateStats, supabase]); 

  const exportToCSV = () => {
    // ✅ CORRECTION SAFARI : Format ISO strict pour l'export CSV
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    const rangeData = allOrders.filter(o => {
      const safeDateStr = o.created_at ? o.created_at.replace(' ', 'T') : '';
      const d = new Date(safeDateStr);
      return d >= start && d <= end;
    });

    const csvRows = [
      ["Date", "Type", "Brut (CHF)", "Frais Est. (CHF)", "Net Est. (CHF)", "Articles"],
      ...rangeData.map(o => {
        const brut = Number(o.total_amount || 0);
        const fees = (brut * 0.029) + 0.30;
        const safeDateStr = o.created_at ? o.created_at.replace(' ', 'T') : '';
        
        return [
          new Date(safeDateStr).toLocaleDateString('fr-FR'),
          o.order_type || 'N/A',
          brut.toFixed(2),
          fees.toFixed(2),
          (brut - fees).toFixed(2),
          Array.isArray(o.items) ? o.items.map(i => `${i.quantity || 1}x ${i.name || 'Produit'}`).join(" | ") : ''
        ];
      })
    ];

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `PlanetFood_Compta_${startDate}_au_${endDate}.csv`; // Ajustement du nom du fichier
    link.click();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="animate-spin text-kabuki-red" size={32} />
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Calcul des marges nettes...</span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 text-white">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest">
            Analyse <span className="text-kabuki-red">Financière</span>
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl">
              <div className="flex items-center gap-2 px-3">
                <Calendar size={14} className="text-gray-500" />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs font-bold uppercase outline-none text-white cursor-pointer"
                />
              </div>
              <ArrowRight size={14} className="text-neutral-700" />
              <div className="flex items-center gap-2 px-3">
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs font-bold uppercase outline-none text-white cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-kabuki-red hover:text-white transition-all shadow-xl"
        >
          <Download size={16} /> Rapport Comptable (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="CA Brut (Reçu)" 
          value={`${stats.rangeRevenueBrut.toFixed(2)} CHF`} 
          icon={<Zap size={20} />} 
          trend="Total payé par les clients"
          color="text-white"
        />
        <StatCard 
          title="CA Net Estimé" 
          value={`${stats.rangeRevenueNet.toFixed(2)} CHF`} 
          icon={<TrendingUp size={20} />} 
          trend="Après commissions Stripe"
          color="text-green-400"
        />
        <StatCard 
          title="Frais de Service" 
          value={`${stats.rangeFees.toFixed(2)} CHF`} 
          icon={<ArrowDownRight size={20} />} 
          trend="Estimation Stripe (2.9% + 0.30)"
          color="text-red-400"
        />
        <StatCard 
          title="Panier Moyen" 
          value={`${stats.averageBasket.toFixed(2)} CHF`} 
          icon={<ShoppingBag size={20} />} 
          trend="Sur la période"
          color="text-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-[32px] p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-kabuki-red/10 rounded-lg"><Trophy size={20} className="text-kabuki-red" /></div>
            <h2 className="text-lg font-bold uppercase tracking-widest">Top 5 sur la période</h2>
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
            )) : <p className="text-gray-500 text-sm italic">Aucune donnée pour cette sélection.</p>}
          </div>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-[32px] p-8">
          <h2 className="text-lg font-bold uppercase tracking-widest mb-8">Canaux de vente</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                <span className="flex items-center gap-2 text-blue-400"><MapPin size={12} /> Livraison</span>
                <span>{stats.rangeOrdersCount > 0 ? Math.round((stats.deliverySplit.delivery / stats.rangeOrdersCount) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${stats.rangeOrdersCount > 0 ? (stats.deliverySplit.delivery / stats.rangeOrdersCount) * 100 : 0}%` }} 
                  className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                <span className="flex items-center gap-2 text-amber-400"><MousePointer2 size={12} /> Click & Collect</span>
                <span>{stats.rangeOrdersCount > 0 ? Math.round((stats.deliverySplit.takeaway / stats.rangeOrdersCount) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${stats.rangeOrdersCount > 0 ? (stats.deliverySplit.takeaway / stats.rangeOrdersCount) * 100 : 0}%` }} 
                  className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
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