"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { 
  Ticket, Plus, Trash2, X, Loader2, 
  CheckCircle2, AlertCircle, Power, PowerOff, 
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  expiration_date: string | null;
  min_order_amount: number;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_amount: "0",
    expiration_date: ""
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCoupons = useCallback(async () => {
    // On ne met loading à true que si on n'a pas déjà de données (optionnel)
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setCoupons(data as Coupon[]);
    if (error) showToast(error.message, 'error');
    setLoading(false);
  }, []);

  useEffect(() => {
    // Utilisation d'une fonction auto-invoquée pour éviter l'appel direct synchrone
    // que le linter interdit dans certains contextes
    const loadData = async () => {
      await fetchCoupons();
    };
    loadData();
  }, [fetchCoupons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const couponData = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_amount: parseFloat(form.min_order_amount),
      expiration_date: form.expiration_date || null,
      is_active: true
    };

    const { error } = await supabase.from("coupons").insert([couponData]);

    if (error) {
      showToast("Ce code existe déjà ou est invalide", "error");
    } else {
      showToast("Coupon créé avec succès !");
      setIsModalOpen(false);
      setForm({ code: "", discount_type: "percentage", discount_value: "", min_order_amount: "0", expiration_date: "" });
      fetchCoupons();
    }
    setIsSubmitting(false);
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase.from("coupons").update({ is_active: !currentStatus }).eq("id", id);
    if (!error) {
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
      showToast(currentStatus ? "Coupon désactivé" : "Coupon activé");
    }
  };

  const deleteCoupon = async (id: number) => {
    if (!confirm("Supprimer ce coupon définitivement ?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (!error) {
      setCoupons(prev => prev.filter(c => c.id !== id));
      showToast("Coupon supprimé");
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-8 pb-24 text-white">
      
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed bottom-10 right-10 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${toast.type === 'success' ? 'bg-neutral-900/90 border-green-500/50 text-green-400' : 'bg-neutral-900/90 border-red-500/50 text-red-400'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold text-sm uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest">
            Codes <span className="text-kabuki-red">Promo</span>
          </h1>
          <p className="text-neutral-500 text-sm mt-2 italic">Gérez vos offres et réductions clients.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-kabuki-red hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-red-900/20 uppercase text-xs tracking-widest">
          <Plus size={18} /> Nouveau Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-20 text-center"><Loader2 className="animate-spin text-kabuki-red mx-auto" size={40} /></div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full p-20 text-center border-2 border-dashed border-neutral-800 rounded-3xl text-neutral-600 font-bold uppercase tracking-widest">Aucun coupon actif</div>
        ) : (
          coupons.map((coupon) => (
            <motion.div layout key={coupon.id} className={`relative bg-neutral-900 border rounded-[32px] p-6 transition-all ${coupon.is_active ? 'border-neutral-800' : 'border-red-900/20 opacity-60'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                  <Ticket size={16} className="text-kabuki-red" />
                  <span className="font-display font-black text-xl tracking-tighter text-white">{coupon.code}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleStatus(coupon.id, coupon.is_active)} className={`p-2 rounded-lg transition-colors ${coupon.is_active ? 'text-green-500 bg-green-500/10' : 'text-gray-500 bg-neutral-800'}`}>
                    {coupon.is_active ? <Power size={18} /> : <PowerOff size={18} />}
                  </button>
                  <button onClick={() => deleteCoupon(coupon.id)} className="p-2 text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500 font-bold uppercase text-[10px] tracking-widest">Valeur</span>
                  <span className="text-white font-black">
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} CHF`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500 font-bold uppercase text-[10px] tracking-widest">Min. Commande</span>
                  <span className="text-white font-bold">{coupon.min_order_amount} CHF</span>
                </div>
                {coupon.expiration_date && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500 font-bold uppercase text-[10px] tracking-widest">Expire le</span>
                    <span className="text-amber-500 font-bold flex items-center gap-1"><Calendar size={12}/> {new Date(coupon.expiration_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-neutral-900 border border-neutral-800 p-8 rounded-[40px] max-w-lg w-full shadow-2xl text-white">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold uppercase tracking-tighter">Nouveau Code Promo</h2>
                <button onClick={() => setIsModalOpen(false)} className="bg-neutral-800 p-2 rounded-full hover:bg-neutral-700 transition"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-widest">Code (Ex: KABUKI20)</label>
                  <input required className="w-full bg-black border border-neutral-800 p-4 rounded-2xl outline-none focus:border-kabuki-red transition text-white font-black" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="BIENVENUE5" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-widest">Type</label>
                    <select className="w-full bg-black border border-neutral-800 p-4 rounded-2xl outline-none focus:border-kabuki-red transition text-white" value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value as 'percentage' | 'fixed'})}>
                      <option value="percentage">Pourcentage (%)</option>
                      <option value="fixed">Montant fixe (CHF)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-widest">Valeur</label>
                    <input type="number" required className="w-full bg-black border border-neutral-800 p-4 rounded-2xl outline-none focus:border-kabuki-red transition text-white" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} placeholder="10" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-widest">Min. Commande (CHF)</label>
                    <input type="number" className="w-full bg-black border border-neutral-800 p-4 rounded-2xl outline-none focus:border-kabuki-red transition text-white" value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: e.target.value})} />
                  </div>
                  <div>
                    {/* ✅ Correction de l'apostrophe ici */}
                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-widest">{"Date d'expiration"}</label>
                    <input type="date" className="w-full bg-black border border-neutral-800 p-4 rounded-2xl outline-none focus:border-kabuki-red transition text-white" value={form.expiration_date} onChange={e => setForm({...form, expiration_date: e.target.value})} />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-kabuki-red text-white py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Créer le coupon"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}