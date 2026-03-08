"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { 
  Search, Edit2, Trash2, Plus, X, Upload, Loader2, 
  CheckCircle2, AlertCircle, Wand2, 
  LogOut, Power, PowerOff, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";

interface MenuItem {
  id: number;
  name_fr: string;
  name_en: string;
  name_es: string;
  price: string | number;
  category: string;
  description_fr: string;
  description_en: string;
  description_es: string;
  image_url: string;
  is_available: boolean; // ✅ Ajouté pour la gestion des stocks
}

export default function AdminMenu() {
  const { lang } = useTranslation(); 
  const [items, setItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null); // ✅ Pour le feedback du toggle
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [form, setForm] = useState<Omit<MenuItem, 'id' | 'is_available'>>({
    name_fr: "", name_en: "", name_es: "",
    price: "", 
    category: "Makis",
    description_fr: "", description_en: "", description_es: "",
    image_url: ""
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("id", { ascending: false });
    
    if (error) {
      showToast(error.message, 'error');
    } else if (data) {
      setItems(data as MenuItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // ✅ TOGGLE DE DISPONIBILITÉ (STOCK)
  const toggleAvailability = async (id: number, currentStatus: boolean) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !currentStatus })
      .eq("id", id);

    if (error) {
      showToast("Erreur de mise à jour", "error");
    } else {
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, is_available: !currentStatus } : item
      ));
      showToast(!currentStatus ? "Produit activé" : "Produit marqué comme épuisé");
    }
    setUpdatingId(null);
  };

  const handleTranslate = async () => {
    if (!form.name_fr && !form.description_fr) {
      showToast("Remplissez d'abord le Français", 'error');
      return;
    }
    setIsTranslating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setForm(prev => ({
        ...prev,
        name_en: prev.name_en || prev.name_fr,
        name_es: prev.name_es || prev.name_fr,
        description_en: prev.description_en || prev.description_fr,
        description_es: prev.description_es || prev.description_fr
      }));
      showToast("Suggestions générées !");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = `/${lang}/login?logout=true`;
  };

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('sushi-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('sushi-images').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, image_url: data.publicUrl }));
      showToast("Image mise à jour !");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur d'upload";
      showToast(message, 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    const productData = { ...form, price: parseFloat(form.price as string) };
    try {
      if (editingId) {
        const { error } = await supabase.from("menu_items").update(productData).eq("id", editingId);
        if (error) throw error;
        showToast("Sushi modifié !");
      } else {
        const { error } = await supabase.from("menu_items").insert([{ ...productData, is_available: true }]);
        if (error) throw error;
        showToast("Nouveau sushi ajouté !");
      }
      setIsModalOpen(false);
      resetForm();
      fetchMenu();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      showToast(message, 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (confirm(`Supprimer définitivement "${name}" ?`)) {
      try {
        const { error } = await supabase.from("menu_items").delete().eq("id", id);
        if (error) throw error;
        setItems(prev => prev.filter(i => i.id !== id));
        showToast("Produit supprimé.");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors de la suppression";
        showToast(message, 'error');
      }
    }
  }

  const resetForm = () => {
    setForm({ 
      name_fr: "", name_en: "", name_es: "", price: "", 
      category: "Makis", description_fr: "", description_en: "", description_es: "", image_url: "" 
    });
    setEditingId(null);
  };

  const openEditModal = (item: MenuItem) => {
    setForm({ 
      ...item, 
      price: item.price.toString(), 
      name_en: item.name_en || "", 
      name_es: item.name_es || "", 
      description_en: item.description_en || "", 
      description_es: item.description_es || "" 
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const filteredItems = items.filter((item) =>
    item.name_fr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 bg-black min-h-screen text-white pt-24 md:pt-32">
      
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.5 }} 
            className={`fixed bottom-10 right-10 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
              toast.type === 'success' ? 'bg-neutral-900/90 border-green-500/50 text-green-400' : 'bg-neutral-900/90 border-red-500/50 text-red-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold text-sm uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold uppercase tracking-wider text-kabuki-red">Administration</h1>
            <button 
              onClick={handleLogout} 
              aria-label="Se déconnecter"
              className="flex items-center gap-2 px-4 py-2 mt-4 text-[11px] font-bold text-gray-400 hover:text-white bg-neutral-900/50 border border-neutral-800 rounded-xl transition-all hover:bg-red-600/10 hover:border-red-600/40 uppercase tracking-[0.2em] group shadow-inner"
            >
              <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
              Se déconnecter
            </button>
          </div>
          
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }} 
            aria-label="Ajouter un nouveau produit"
            className="flex items-center gap-2 bg-kabuki-red hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-red-900/20 uppercase text-xs tracking-widest"
          >
             <Plus size={20} /> Nouveau Produit
          </button>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} aria-hidden="true" />
          <input 
            type="text" 
            placeholder="Rechercher un plat..." 
            aria-label="Rechercher dans le menu"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-kabuki-red outline-none shadow-xl transition-all" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4 text-gray-500">
              <Loader2 className="animate-spin text-kabuki-red" size={40} />
              <p className="italic uppercase text-[10px] tracking-widest">Chargement des sushis...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-800/50 text-gray-400 uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="p-5">Plat</th>
                    <th className="p-5 text-center">Catégorie</th>
                    <th className="p-5 text-center">Disponibilité</th> {/* ✅ Nouvelle colonne */}
                    <th className="p-5 text-center">Prix</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={`transition-colors group ${!item.is_available ? 'bg-red-900/5 opacity-60' : 'hover:bg-white/5'}`}>
                      <td className="p-5 flex items-center gap-4">
                        <div className="relative w-12 h-12 shrink-0">
                          <Image 
                            src={item.image_url || "/placeholder-sushi.jpg"} 
                            alt={item.name_fr} 
                            fill 
                            className={`rounded-xl object-cover bg-neutral-800 border border-neutral-800 shadow-lg ${!item.is_available ? 'grayscale' : ''}`} 
                          />
                        </div>
                        <div>
                          <div className="font-bold text-white">{item.name_fr}</div>
                          <div className="text-[10px] text-gray-500 line-clamp-1 italic">{item.description_fr}</div>
                        </div>
                      </td>
                      <td className="p-5 text-center text-[10px] text-gray-400 font-bold uppercase">{item.category}</td>
                      
                      {/* ✅ TOGGLE DISPONIBILITÉ (STOCK) */}
                      <td className="p-5 text-center">
                        <button
                          onClick={() => toggleAvailability(item.id, item.is_available)}
                          disabled={updatingId === item.id}
                          aria-label={item.is_available ? "Marquer comme épuisé" : "Marquer comme disponible"}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${
                            item.is_available 
                              ? "bg-green-500/10 border-green-500/20 text-green-500" 
                              : "bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                          }`}
                        >
                          {updatingId === item.id ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : item.is_available ? (
                            <><Power size={12} /> Actif</>
                          ) : (
                            <><PowerOff size={12} /> Épuisé</>
                          )}
                        </button>
                      </td>

                      <td className="p-5 text-center font-mono text-kabuki-red font-bold">
                        {Number(item.price).toFixed(2)} <span className="text-[10px]">CHF</span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => openEditModal(item)} aria-label="Modifier" className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(item.id, item.name_fr)} aria-label="Supprimer" className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 p-6 md:p-8 rounded-3xl max-w-4xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
                <h2 className="text-2xl font-bold uppercase tracking-tighter">{editingId ? "Modifier le Sushi" : "Ajouter à la Carte"}</h2>
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={handleTranslate} 
                    disabled={isTranslating} 
                    aria-label="Traduire automatiquement"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition disabled:opacity-50"
                  >
                    {isTranslating ? <Loader2 className="animate-spin" size={14}/> : <Wand2 size={14}/>} Traduire
                  </button>
                  <button onClick={() => setIsModalOpen(false)} aria-label="Fermer" className="bg-neutral-800 p-2 rounded-full hover:bg-neutral-700 transition"><X size={20}/></button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-widest">Nom (FR)</label><input className="w-full bg-black border border-neutral-800 p-3 rounded-xl outline-none focus:border-kabuki-red transition text-white" value={form.name_fr} onChange={e => setForm({...form, name_fr: e.target.value})} required /></div>
                  <div><label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-widest">Nom (EN)</label><input className="w-full bg-black border border-neutral-800 p-3 rounded-xl outline-none focus:border-kabuki-red transition text-white" value={form.name_en} onChange={e => setForm({...form, name_en: e.target.value})} /></div>
                  <div><label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-widest">Nom (ES)</label><input className="w-full bg-black border border-neutral-800 p-3 rounded-xl outline-none focus:border-kabuki-red transition text-white" value={form.name_es} onChange={e => setForm({...form, name_es: e.target.value})} /></div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-widest">Prix (CHF)</label><input type="number" step="0.05" className="w-full bg-black border border-neutral-800 p-3 rounded-xl outline-none focus:border-kabuki-red transition text-white" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
                  <div>
                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-widest">Catégorie</label>
                    <select className="w-full bg-black border border-neutral-800 p-3 rounded-xl outline-none focus:border-kabuki-red transition text-white" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      <option>Les Signatures (Créations Kabuki)</option>
                      <option>Makis</option>
                      <option>Sushis</option>
                      <option>Entrées & Accompagnements</option>
                      <option>Box à Partager</option>
                      <option>Burrito Sushi (Format généreux)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-widest">Description (FR)</label><textarea className="w-full bg-black border border-neutral-800 p-3 rounded-xl outline-none focus:border-kabuki-red h-24 resize-none transition text-white" value={form.description_fr} onChange={e => setForm({...form, description_fr: e.target.value})} /></div>
                  <div><label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-widest">Description (EN)</label><textarea className="w-full bg-black border border-neutral-800 p-3 rounded-xl outline-none focus:border-kabuki-red h-24 resize-none transition text-white" value={form.description_en} onChange={e => setForm({...form, description_en: e.target.value})} /></div>
                  <div><label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-widest">Description (ES)</label><textarea className="w-full bg-black border border-neutral-800 p-3 rounded-xl outline-none focus:border-kabuki-red h-24 resize-none transition text-white" value={form.description_es} onChange={e => setForm({...form, description_es: e.target.value})} /></div>
                </div>

                <div className="border-2 border-dashed border-neutral-800 p-6 rounded-2xl text-center hover:border-kabuki-red transition-colors group relative">
                  {form.image_url ? (
                    <div className="relative group">
                      <Image src={form.image_url} alt="Aperçu" width={150} height={128} className="mx-auto rounded-lg object-cover shadow-xl" />
                      <button type="button" onClick={() => setForm(prev => ({...prev, image_url: ""}))} aria-label="Supprimer l'image" className="absolute top-0 right-0 bg-red-600 rounded-full p-1 shadow-lg translate-x-1/2 -translate-y-1/2 text-white"><X size={12}/></button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-2 text-gray-600 group-hover:text-kabuki-red transition-colors" aria-hidden="true" />
                      <label htmlFor="image-upload-admin" className="cursor-pointer text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                        {uploading ? "Envoi en cours..." : "Cliquez pour uploader une photo"}
                      </label>
                      <input id="image-upload-admin" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={actionLoading || uploading || isTranslating} 
                  className="w-full bg-kabuki-red text-white py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-900/20 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={20} /> : (editingId ? "Sauvegarder les changements" : "Ajouter au menu")}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}