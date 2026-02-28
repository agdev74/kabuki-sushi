"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Clock, Calendar, MessageSquare, Loader2, CheckCircle, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";
import { supabase } from "@/utils/supabase"; 

// ✅ IMPORTS STRIPE
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const cartTranslations = {
  fr: {
    titleCart: "Mon Panier", titleCheckout: "Validation", titlePayment: "Paiement Sécurisé", emptyCart: "Votre panier est vide", items: "article", itemsPlural: "articles", clearCart: "Vider le panier", name: "Nom Complet *", namePlaceholder: "Jean Dupont", phone: "Téléphone *", date: "Date *", time: "Heure *", pickupMode: "Mode de retrait *", takeaway: "À Emporter", delivery: "Livraison", address: "Adresse *", addressPlaceholder: "Rue des Alpes 12", zip: "NPA *", floor: "Étage", floorPlaceholder: "Ex: 4", code: "Code", codePlaceholder: "Ex: A123", comments: "Instructions / Allergies", commentsPlaceholder: "Sans wasabi...", totalEstimated: "Total à payer", btnValidate: "Passer à la caisse", btnPay: "Payer la commande", minOrderError: "Minimum 25 CHF requis.", noTimeSlots: "Aucun horaire disponible.", today: "Aujourd'hui", tomorrow: "Demain", sending: "Génération...", processing: "Traitement...", paymentError: "Le paiement a échoué.", successTitle: "Paiement réussi !", successDesc: "Votre commande est validée.", btnClose: "Fermer", cancelPayment: "Annuler"
  },
  en: {
    titleCart: "My Cart", titleCheckout: "Checkout", titlePayment: "Secure Payment", emptyCart: "Empty cart", items: "item", itemsPlural: "items", clearCart: "Clear", name: "Name *", namePlaceholder: "John Doe", phone: "Phone *", date: "Date *", time: "Time *", pickupMode: "Method *", takeaway: "Takeaway", delivery: "Delivery", address: "Address *", addressPlaceholder: "Street", zip: "ZIP *", floor: "Floor", floorPlaceholder: "Ex: 4", code: "Code", codePlaceholder: "Ex: A123", comments: "Instructions", commentsPlaceholder: "Allergies...", totalEstimated: "Total", btnValidate: "Checkout", btnPay: "Pay Now", minOrderError: "Min 25 CHF.", noTimeSlots: "No slots.", today: "Today", tomorrow: "Tomorrow", sending: "Sending...", processing: "Processing...", paymentError: "Failed.", successTitle: "Success!", successDesc: "Confirmed.", btnClose: "Close", cancelPayment: "Cancel"
  },
  es: {
    titleCart: "Mi Carrito", titleCheckout: "Pago", titlePayment: "Pago Seguro", emptyCart: "Vacío", items: "artículo", itemsPlural: "artículos", clearCart: "Vaciar", name: "Nombre *", namePlaceholder: "Juan", phone: "Teléfono *", date: "Fecha *", time: "Hora *", pickupMode: "Método *", takeaway: "Para llevar", delivery: "Entrega", address: "Dirección *", addressPlaceholder: "Calle", zip: "CP *", floor: "Piso", floorPlaceholder: "Ej: 4", code: "Código", codePlaceholder: "Ej: A123", comments: "Notas", commentsPlaceholder: "Alergias...", totalEstimated: "Total", btnValidate: "Pagar", btnPay: "Pagar pedido", minOrderError: "Mínimo 25 CHF.", noTimeSlots: "No disponible.", today: "Hoy", tomorrow: "Mañana", sending: "Enviando...", processing: "Procesando...", paymentError: "Error.", successTitle: "¡Éxito!", successDesc: "Confirmado.", btnClose: "Cerrar", cancelPayment: "Cancelar"
  }
};

// ✅ INTERFACES
interface CartDrawerProps { isOpen: boolean; onClose: () => void; }
interface StripeCheckoutFormProps { total: number; onSuccess: () => void; onCancel: () => void; t: Record<string, string>; }

function StripeCheckoutForm({ total, onSuccess, onCancel, t }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setErrorMessage("");

    const result = await stripe.confirmPayment({ elements, redirect: "if_required" });

    if (result.error) {
      setErrorMessage(result.error.message ?? t.paymentError);
      setIsProcessing(false);
    } else if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
      onSuccess();
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3 text-green-500">
          <ShieldCheck size={24} /><p className="text-xs font-bold uppercase">SSL Encrypted</p>
        </div>
        <PaymentElement options={{ layout: "tabs" }} />
        {errorMessage && <div className="text-red-500 text-xs font-bold bg-red-900/20 p-3 rounded-xl">⚠️ {errorMessage}</div>}
      </div>
      <div className="p-6 border-t border-neutral-800 bg-neutral-900 space-y-3">
        <button type="submit" disabled={!stripe || isProcessing} className={`w-full font-bold py-4 rounded-xl uppercase flex items-center justify-center gap-2 ${isProcessing ? "bg-neutral-800 text-neutral-500" : "bg-green-600 text-white shadow-lg"}`}>
          {isProcessing ? <><Loader2 size={18} className="animate-spin" /> {t.processing}</> : `${t.btnPay} (${total.toFixed(2)} CHF)`}
        </button>
        <button type="button" onClick={onCancel} className="w-full text-gray-500 text-[10px] font-bold uppercase py-2 hover:text-white transition">{t.cancelPayment}</button>
      </div>
    </form>
  );
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart, totalItems } = useCart();
  const { lang } = useTranslation();
  const t = cartTranslations[lang as keyof typeof cartTranslations] || cartTranslations.fr;

  const [isCheckout, setIsCheckout] = useState(false);
  const [isPayment, setIsPayment] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: "", phone: "", type: "Click & Collect", address: "", zip: "", floor: "", doorCode: "", comments: "" });
  
  const days = [];
  const todayDate = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() + i);
    if (d.getDay() !== 1) days.push(d); 
  }
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(days[0]);
  const [selectedTime, setSelectedTime] = useState<string>("");

  const availableSlots = selectedDate ? (() => {
    const day = selectedDate.getDay();
    const slots = (day >= 2 && day <= 5) ? ["11:30", "12:00", "12:30", "13:00", "13:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"] : ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];
    const now = new Date();
    if (selectedDate.toDateString() === now.toDateString()) {
      const cur = now.getHours() + now.getMinutes() / 60;
      return slots.filter(s => { const [h, m] = s.split(':').map(Number); return (h + m / 60) > (cur + 0.5); });
    }
    return slots;
  })() : [];

  const isFormReady = (formData.type !== "Livraison" || totalPrice >= 25) && selectedDate && selectedTime !== "";

  const handlePreparePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormReady) return;
    setIsSubmitting(true);
    try {
      const { data, error: sbError } = await supabase.from('orders').insert([{
        customer_name: formData.name, customer_phone: formData.phone, pickup_date: selectedDate?.toISOString().split('T')[0],
        pickup_time: selectedTime, order_type: formData.type, delivery_address: formData.address, total_amount: totalPrice,
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })), status: "En attente de paiement"
      }]).select();
      if (sbError) throw sbError;
      const newId = data[0].id;
      setOrderId(newId);
      const res = await fetch("/api/create-payment-intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: totalPrice, orderId: newId }) });
      const payData = await res.json();
      if (payData.error) throw new Error(payData.error);
      setClientSecret(payData.clientSecret);
      setIsPayment(true);
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Erreur : ${error.message}`);
    } finally { setIsSubmitting(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-neutral-900 border-l border-neutral-800 z-[101] flex flex-col">
            {!isSuccess && (
              <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                <h2 className="text-xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-3">
                  {isPayment ? <><ShieldCheck size={20} className="text-green-500" /> {t.titlePayment}</> : isCheckout ? <><button onClick={() => setIsCheckout(false)} className="hover:text-kabuki-red transition"><ArrowLeft size={20} /></button> {t.titleCheckout}</> : <><ShoppingBag size={20} className="text-kabuki-red" /> {t.titleCart}</>}
                </h2>
                <button onClick={onClose} className="p-2 text-gray-400 bg-neutral-800 rounded-full hover:text-white transition"><X size={18} /></button>
              </div>
            )}
            {isSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
                <CheckCircle size={48} className="text-green-500" />
                <h2 className="text-2xl font-bold text-white uppercase">{t.successTitle}</h2>
                <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 w-full"><p className="text-gray-300 text-sm mb-2">{t.successDesc}</p><p className="text-xl font-bold text-kabuki-red">#KBK-{orderId}</p></div>
                <button onClick={onClose} className="w-full bg-neutral-800 text-white font-bold py-4 rounded-xl uppercase">{t.btnClose}</button>
              </div>
            ) : isPayment && clientSecret ? (
              <Elements options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#dc2626' } } }} stripe={stripePromise}>
                <StripeCheckoutForm total={totalPrice} onSuccess={() => { clearCart(); setIsPayment(false); setIsSuccess(true); }} onCancel={() => setIsPayment(false)} t={t} />
              </Elements>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {items.length === 0 ? <p className="text-center text-gray-500 uppercase tracking-widest py-20">{t.emptyCart}</p> : 
                    !isCheckout ? (
                      <div className="space-y-6">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-2"><ShoppingBag size={12} /> {totalItems} {totalItems > 1 ? t.itemsPlural : t.items}</div>
                        {items.map(i => (
                          <div key={i.id} className="flex gap-4 items-center bg-black/40 p-3 rounded-2xl border border-neutral-800/50">
                            <div className="w-16 h-16 relative bg-neutral-800 rounded-xl overflow-hidden shrink-0">{i.image_url && <Image src={i.image_url} alt={i.name} fill className="object-cover" />}</div>
                            <div className="flex-1"><h4 className="text-white font-bold text-sm uppercase">{i.name}</h4><div className="text-kabuki-red font-bold text-xs">{(i.price * i.quantity).toFixed(2)} CHF</div></div>
                            <div className="flex items-center gap-3 bg-neutral-800 rounded-full px-2 py-1"><button onClick={() => updateQuantity(i.id, i.quantity - 1)} className="text-white hover:text-kabuki-red transition"><Minus size={14} /></button><span className="text-white text-xs font-bold">{i.quantity}</span><button onClick={() => updateQuantity(i.id, i.quantity + 1)} className="text-white hover:text-kabuki-red transition"><Plus size={14} /></button></div>
                            <button onClick={() => removeFromCart(i.id)} className="text-gray-500 hover:text-kabuki-red transition"><Trash2 size={16} /></button>
                          </div>
                        ))}
                        <button onClick={clearCart} className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2 mx-auto"><Trash2 size={12} /> {t.clearCart}</button>
                      </div>
                    ) : (
                      <form id="checkout-form" onSubmit={handlePreparePayment} className="space-y-6">
                        <input required placeholder={t.namePlaceholder} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black text-white border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-kabuki-red transition" />
                        <input required type="tel" placeholder="079..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black text-white border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-kabuki-red transition" />
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-kabuki-red uppercase flex items-center gap-2"><Calendar size={12} /> {t.date}</label>
                          <div className="flex gap-2 overflow-x-auto pb-2">{days.map((d, idx) => (
                            <button key={idx} type="button" onClick={() => { setSelectedDate(d); setSelectedTime(""); }} className={`shrink-0 px-4 py-2 rounded-xl border text-xs font-bold transition ${selectedDate?.toDateString() === d.toDateString() ? "bg-kabuki-red border-kabuki-red text-white" : "bg-neutral-800 border-neutral-700 text-gray-400"}`}>{d.toLocaleDateString(lang, { day: 'numeric', month: 'short' })}</button>
                          ))}</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-kabuki-red uppercase flex items-center gap-2"><Clock size={12} /> {t.time}</label>
                          <div className="grid grid-cols-4 gap-2">{availableSlots.map(s => <button key={s} type="button" onClick={() => setSelectedTime(s)} className={`py-2 rounded-lg border text-xs font-bold transition ${selectedTime === s ? "bg-kabuki-red border-kabuki-red text-white" : "bg-neutral-800 border-neutral-700 text-gray-400"}`}>{s}</button>)}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button type="button" onClick={() => setFormData({...formData, type: "Click & Collect"})} className={`py-3 rounded-xl border text-xs font-bold transition ${formData.type !== "Livraison" ? "bg-kabuki-red border-kabuki-red text-white" : "bg-black border-neutral-800 text-gray-400"}`}>{t.takeaway}</button>
                          <button type="button" onClick={() => setFormData({...formData, type: "Livraison"})} className={`py-3 rounded-xl border text-xs font-bold transition ${formData.type === "Livraison" ? "bg-kabuki-red border-kabuki-red text-white" : "bg-black border-neutral-800 text-gray-400"}`}>{t.delivery}</button>
                        </div>
                        <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2"><MessageSquare size={12} /> {t.comments}</label><textarea value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} className="w-full bg-black text-white border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-kabuki-red transition h-20 resize-none" placeholder={t.commentsPlaceholder} /></div>
                      </form>
                    )
                  }
                </div>
                {items.length > 0 && (
                  <div className="p-6 border-t border-neutral-800 bg-neutral-900 shrink-0">
                    <div className="flex justify-between items-center mb-4"><span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{t.totalEstimated}</span><span className="text-2xl font-display font-bold text-white">{totalPrice.toFixed(2)} CHF</span></div>
                    {!isCheckout ? <button onClick={() => setIsCheckout(true)} className="w-full bg-kabuki-red text-white font-bold py-4 rounded-xl uppercase flex items-center justify-center gap-2 hover:bg-red-700 transition">{t.btnValidate} <ArrowRight size={16} /></button> : <button type="submit" form="checkout-form" disabled={!isFormReady || isSubmitting} className={`w-full font-bold py-4 rounded-xl uppercase flex items-center justify-center gap-2 transition ${isFormReady && !isSubmitting ? "bg-kabuki-red text-white hover:bg-red-700 shadow-red-900/20" : "bg-neutral-800 text-neutral-500 cursor-not-allowed"}`}>{isSubmitting ? <><Loader2 size={18} className="animate-spin" /> {t.sending}</> : <><ShieldCheck size={18} /> Continuer</>}</button>}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}