"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Clock, Calendar, MessageSquare, Loader2, CheckCircle, ShieldCheck, MapPin, Tag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/utils/supabase/client"; 
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// ✅ IMPORT DU CONTEXTE UTILISATEUR
import { useUser } from "@/context/UserContext";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const cartTranslations = {
  fr: {
    titleCart: "Mon Panier", titleCheckout: "Validation", titlePayment: "Paiement Sécurisé", emptyCart: "Votre panier est vide", items: "article", itemsPlural: "articles", clearCart: "Vider le panier", name: "Nom Complet *", namePlaceholder: "Jean Dupont", phone: "Téléphone Mobile *", phonePlaceholder: "07X XXX XX XX", date: "Date *", time: "Heure *", pickupMode: "Mode de retrait *", takeaway: "À Emporter", delivery: "Livraison", address: "Adresse *", addressPlaceholder: "Rue des Alpes 12", zip: "NPA *", floor: "Étage", floorPlaceholder: "Ex: 4", code: "Code", codePlaceholder: "Ex: A123", comments: "Instructions / Allergies", commentsPlaceholder: "Sans wasabi...", totalEstimated: "Total à payer", btnValidate: "Passer à la caisse", btnPay: "Payer la commande", minOrderError: "Minimum 25 CHF requis pour la livraison.", noTimeSlots: "Aucun horaire disponible.", today: "Aujourd'hui", tomorrow: "Demain", sending: "Génération...", processing: "Traitement...", paymentError: "Le paiement a échoué.", successTitle: "Paiement réussi !", successDesc: "Votre commande est validée.", btnClose: "Fermer", cancelPayment: "Annuler", remove: "Supprimer", decrease: "Diminuer quantité", increase: "Augmenter quantité", back: "Retour",
    couponLabel: "Code Promo", couponPlaceholder: "EX: KABUKI10", couponBtn: "Appliquer", couponInvalid: "Code invalide ou expiré", couponMinError: "Min. {min} CHF requis", discount: "Réduction"
  },
  en: {
    titleCart: "My Cart", titleCheckout: "Checkout", titlePayment: "Secure Payment", emptyCart: "Empty", items: "item", itemsPlural: "items", clearCart: "Clear", name: "Name *", namePlaceholder: "John Doe", phone: "Mobile Phone *", phonePlaceholder: "07X XXX XX XX", date: "Date *", time: "Time *", pickupMode: "Method *", takeaway: "Takeaway", delivery: "Delivery", address: "Address *", addressPlaceholder: "Street", zip: "ZIP *", floor: "Floor", floorPlaceholder: "Ex: 4", code: "Code", codePlaceholder: "Ex: A123", comments: "Instructions", commentsPlaceholder: "Allergies...", totalEstimated: "Total", btnValidate: "Checkout", btnPay: "Pay Now", minOrderError: "Min 25 CHF for delivery.", noTimeSlots: "No slots.", today: "Today", tomorrow: "Tomorrow", sending: "Sending...", processing: "Processing...", paymentError: "Failed.", successTitle: "Success!", successDesc: "Confirmed.", btnClose: "Close", cancelPayment: "Cancel", remove: "Remove", decrease: "Decrease", increase: "Increase", back: "Back",
    couponLabel: "Promo Code", couponPlaceholder: "EX: KABUKI10", couponBtn: "Apply", couponInvalid: "Invalid or expired", couponMinError: "Min. {min} CHF required", discount: "Discount"
  },
  es: {
    titleCart: "Carrito", titleCheckout: "Pago", titlePayment: "Pago Seguro", emptyCart: "Vacío", items: "artículo", itemsPlural: "artículos", clearCart: "Vaciar", name: "Nombre *", namePlaceholder: "Juan", phone: "Teléfono *", phonePlaceholder: "07X XXX XX XX", date: "Fecha *", time: "Hora *", pickupMode: "Método *", takeaway: "Para llevar", delivery: "Entrega", address: "Dirección *", addressPlaceholder: "Calle", zip: "CP *", floor: "Piso", floorPlaceholder: "Ej: 4", code: "Código", codePlaceholder: "Ej: A123", comments: "Notas", commentsPlaceholder: "Alergias...", totalEstimated: "Total", btnValidate: "Pagar", btnPay: "Pagar pedido", minOrderError: "Mínimo 25 CHF para entrega.", noTimeSlots: "No disponible.", today: "Hoy", tomorrow: "Mañana", sending: "Enviando...", processing: "Procesando...", paymentError: "Error.", successTitle: "¡Éxito!", successDesc: "Confirmado.", btnClose: "Cerrar", cancelPayment: "Cancelar", remove: "Eliminar", decrease: "Disminuir", increase: "Aumentar", back: "Volver",
    couponLabel: "Código Promo", couponPlaceholder: "EJ: KABUKI10", couponBtn: "Aplicar", couponInvalid: "Inválido o expirado", couponMinError: "Min. {min} CHF requerido", discount: "Descuento"
  }
};

interface CartDrawerProps { isOpen: boolean; onClose: () => void; }
interface StripeCheckoutFormProps { total: number; onSuccess: () => void; onCancel: () => void; t: Record<string, string>; orderId: number; }

function StripeCheckoutForm({ total, onSuccess, onCancel, t }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setErrorMessage("");

    const response = await stripe.confirmPayment({ elements, redirect: "if_required" });

    if (response.error) {
      setErrorMessage(response.error.message ?? t.paymentError);
      setIsProcessing(false);
    } else if (response.paymentIntent && response.paymentIntent.status === "succeeded") {
      onSuccess();
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleStripeSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3 text-green-500">
          <ShieldCheck size={24} aria-hidden="true" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Paiement 100% Sécurisé</p>
        </div>
        <PaymentElement options={{ layout: "tabs" }} />
        {errorMessage && <div role="alert" className="text-red-500 text-xs font-bold bg-red-900/20 p-3 rounded-xl">⚠️ {errorMessage}</div>}
      </div>
      <div className="p-6 border-t border-neutral-800 bg-neutral-900 space-y-3">
        <button type="submit" disabled={!stripe || isProcessing} className={`w-full font-bold py-4 rounded-xl uppercase flex items-center justify-center gap-2 transition-all ${isProcessing ? "bg-neutral-800 text-neutral-500" : "bg-green-600 text-white shadow-lg shadow-green-900/20 hover:bg-green-500"}`}>
          {isProcessing ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> {t.processing}</> : `${t.btnPay} (${total.toFixed(2)} CHF)`}
        </button>
        <button type="button" onClick={onCancel} className="w-full text-gray-400 text-[10px] font-bold uppercase py-2 hover:text-white transition">{t.cancelPayment}</button>
      </div>
    </form>
  );
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const supabase = useMemo(() => createClient(), []);

  const { items, updateQuantity, removeFromCart, totalPrice, clearCart, totalItems } = useCart();
  const { lang } = useTranslation();
  const t = cartTranslations[lang as keyof typeof cartTranslations] || cartTranslations.fr;

  // ✅ RECUPERATION DU CONTEXTE UTILISATEUR ET ETAT DU CASHBACK
  const { user, profile } = useUser(); 
  const [useWallet, setUseWallet] = useState(false); 

  const [isCheckout, setIsCheckout] = useState(false);
  const [isPayment, setIsPayment] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // ✅ ÉTATS COUPONS
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount_type: string, discount_value: number, min_order_amount: number} | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  const [formData, setFormData] = useState({ 
    name: profile?.full_name || "", // ✅ Pré-remplissage avec le profil
    phone: profile?.phone || "",     // ✅ Pré-remplissage avec le profil
    type: "Click & Collect", 
    address: "", 
    zip: "", 
    floor: "", 
    doorCode: "", 
    comments: "" 
  });
  
  const days = [];
  const start = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
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

  // ✅ LOGIQUE DE CALCUL DU PRIX FINAL AVEC CASHBACK
  const discountAmount = appliedCoupon 
    ? (appliedCoupon.discount_type === 'percentage' ? (totalPrice * appliedCoupon.discount_value / 100) : appliedCoupon.discount_value)
    : 0;
  
  const priceAfterCoupon = Math.max(0, totalPrice - discountAmount);
  
  let walletUsed = 0;
  if (useWallet && profile?.wallet_balance && profile.wallet_balance > 0) {
    // On ne déduit pas plus que le prix de la commande
    walletUsed = Math.min(priceAfterCoupon, profile.wallet_balance);
  }

  const finalPrice = priceAfterCoupon - walletUsed;
  const earnedCashback = finalPrice * 0.05; // 5% de la somme réellement payée

  useEffect(() => {
    if (appliedCoupon && totalPrice < appliedCoupon.min_order_amount) {
      setAppliedCoupon(null);
      setCouponError(t.couponMinError.replace("{min}", appliedCoupon.min_order_amount.toString()));
    }
  }, [totalPrice, appliedCoupon, t.couponMinError]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsVerifyingCoupon(true);
    setCouponError("");

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setCouponError(t.couponInvalid);
      setAppliedCoupon(null);
    } else if (totalPrice < data.min_order_amount) {
      setCouponError(t.couponMinError.replace("{min}", data.min_order_amount.toString()));
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(data);
      setCouponCode("");
    }
    setIsVerifyingCoupon(false);
  };

  const isGenevaZip = (zip: string) => /^12\d{2}$/.test(zip.trim());

  const isDeliveryValid = formData.type !== "Livraison" || (
    totalPrice >= 25 && 
    formData.address.trim() !== "" && 
    isGenevaZip(formData.zip) 
  );
  
  const isFormReady = selectedDate && selectedTime !== "" && formData.name.trim() !== "" && formData.phone.trim() !== "" && isDeliveryValid;

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormReady) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/create-payment-intent", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          amount: totalPrice, 
          couponCode: appliedCoupon?.code,
          useWallet: useWallet, // ✅ ENVOI DU CHOIX AU BACKEND
          items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          customerName: formData.name,
          customerPhone: formData.phone,
          pickupDate: selectedDate?.toISOString().split('T')[0],
          pickupTime: selectedTime,
          orderType: formData.type,
          deliveryAddress: formData.type === "Livraison" ? `${formData.address} ${formData.floor ? '(Ét.'+formData.floor+')' : ''} ${formData.doorCode ? '[Code:'+formData.doorCode+']' : ''}` : null,
          deliveryZip: formData.type === "Livraison" ? formData.zip : null,
          comments: formData.comments
        }) 
      });
      
      const payData = await res.json();
      
      if (payData.error) throw new Error(payData.error);
      if (!payData.clientSecret || !payData.orderId) throw new Error("Réponse API invalide");
      
      setOrderId(payData.orderId);
      setClientSecret(payData.clientSecret);
      setIsPayment(true);
      
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(`Erreur : ${errorObj.message}`);
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100" aria-hidden="true" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed top-0 right-0 h-full w-full md:w-112.5 bg-neutral-900 border-l border-neutral-800 z-101 flex flex-col shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            {!isSuccess && (
              <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-black/20">
                <h2 id="cart-title" className="text-xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-3">
                  {isPayment ? <><ShieldCheck size={20} className="text-green-500" aria-hidden="true" /> {t.titlePayment}</> : isCheckout ? <><button onClick={() => setIsCheckout(false)} className="hover:text-kabuki-red transition" aria-label={t.back}><ArrowLeft size={20} aria-hidden="true" /></button> {t.titleCheckout}</> : <><ShoppingBag size={20} className="text-kabuki-red" aria-hidden="true" /> {t.titleCart}</>}
                </h2>
                <button onClick={onClose} aria-label={t.btnClose} className="p-2 text-gray-400 bg-neutral-800 rounded-full hover:text-white transition"><X size={18} aria-hidden="true" /></button>
              </div>
            )}
            
            {isSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle size={48} className="text-green-500" aria-hidden="true" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{t.successTitle}</h2>
                <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 w-full shadow-inner">
                    <p className="text-gray-300 text-sm mb-4">{t.successDesc}</p>
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Numéro de commande</span>
                    <p className="text-3xl font-display font-bold text-kabuki-red tracking-tighter mt-1">#KBK-{orderId}</p>
                </div>
                <button onClick={() => { onClose(); window.location.href = `/${lang}/track?order_id=${orderId}`; }} className="w-full bg-kabuki-red text-white font-bold py-4 rounded-xl uppercase shadow-lg shadow-red-900/30 hover:bg-red-700 transition-all">Suivre ma commande</button>
              </div>
            ) : isPayment && clientSecret && orderId ? (
              <Elements options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#dc2626' } } }} stripe={stripePromise}>
                <StripeCheckoutForm total={finalPrice} orderId={orderId} onSuccess={() => { clearCart(); setIsPayment(false); setIsSuccess(true); }} onCancel={() => setIsPayment(false)} t={t} />
              </Elements>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {items.length === 0 ? <p className="text-center text-gray-400 uppercase py-20 font-bold tracking-widest">{t.emptyCart}</p> : 
                    !isCheckout ? (
                      <div className="space-y-6">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-2"><ShoppingBag size={12} aria-hidden="true" /> {totalItems} {totalItems > 1 ? t.itemsPlural : t.items}</div>
                        {items.map(i => (
                          <div key={i.id} className="flex gap-4 items-center bg-black/40 p-3 rounded-2xl border border-neutral-800/50 hover:border-neutral-700 transition">
                            <div className="w-16 h-16 relative bg-neutral-800 rounded-xl overflow-hidden shrink-0 shadow-md">
                              {i.image_url && <Image src={i.image_url} alt={i.name} fill className="object-cover" />}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-bold text-sm uppercase leading-tight">{i.name}</h3>
                              <div className="text-kabuki-red font-bold text-xs">{(i.price * i.quantity).toFixed(2)} CHF</div>
                            </div>
                            <div className="flex items-center gap-3 bg-neutral-800 rounded-full px-2 py-1 shadow-inner border border-neutral-700/50">
                              <button onClick={() => updateQuantity(i.id, i.quantity - 1)} aria-label={t.decrease} className="text-white hover:text-kabuki-red transition"><Minus size={14} aria-hidden="true" /></button>
                              <span className="text-white text-xs font-black w-4 text-center" aria-live="polite">{i.quantity}</span>
                              <button onClick={() => updateQuantity(i.id, i.quantity + 1)} aria-label={t.increase} className="text-white hover:text-kabuki-red transition"><Plus size={14} aria-hidden="true" /></button>
                            </div>
                            <button onClick={() => removeFromCart(i.id)} aria-label={t.remove} className="text-gray-400 hover:text-kabuki-red transition p-1"><Trash2 size={16} aria-hidden="true" /></button>
                          </div>
                        ))}

                        <div className="mt-6 p-4 bg-black/40 rounded-2xl border border-neutral-800">
                          <label htmlFor="coupon" className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Tag size={12}/> {t.couponLabel}</label>
                          <div className="flex gap-2">
                            <input 
                              id="coupon"
                              type="text" 
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              placeholder={t.couponPlaceholder}
                              className="flex-1 bg-black border border-neutral-800 rounded-xl px-4 py-2 text-xs text-white focus:border-kabuki-red outline-none transition uppercase"
                            />
                            <button 
                              onClick={handleApplyCoupon}
                              disabled={isVerifyingCoupon || !couponCode}
                              className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition"
                            >
                              {isVerifyingCoupon ? <Loader2 size={14} className="animate-spin" /> : t.couponBtn}
                            </button>
                          </div>
                          {couponError && <p className="text-red-500 text-[9px] mt-2 font-bold uppercase">{couponError}</p>}
                          {appliedCoupon && (
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-green-500 text-[9px] font-bold uppercase flex items-center gap-1">✓ {appliedCoupon.code} (-{appliedCoupon.discount_value}{appliedCoupon.discount_type === 'percentage' ? '%' : ' CHF'})</p>
                              <button onClick={() => setAppliedCoupon(null)} className="text-gray-500 hover:text-red-500 transition"><X size={12}/></button>
                            </div>
                          )}
                        </div>

                        <button onClick={clearCart} className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase flex items-center gap-2 mx-auto transition"><Trash2 size={12} aria-hidden="true" /> {t.clearCart}</button>
                      </div>
                    ) : (
                      <form id="checkout-form" onSubmit={handleFinalSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label htmlFor="customer_name" className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.name}</label>
                            <input id="customer_name" required placeholder={t.namePlaceholder} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black text-white border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-kabuki-red transition" />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="customer_phone" className="text-[10px] font-bold text-kabuki-red uppercase ml-1 tracking-widest">{t.phone}</label>
                            <input id="customer_phone" required type="tel" placeholder={t.phonePlaceholder} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black text-white border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-kabuki-red transition font-mono" />
                        </div>
                        
                        <fieldset className="space-y-2">
                          <legend className="text-[10px] font-bold text-kabuki-red uppercase flex items-center gap-2 mb-2"><Calendar size={12} aria-hidden="true" /> {t.date}</legend>
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {days.map((d, idx) => (
                              <button key={idx} type="button" onClick={() => { setSelectedDate(d); setSelectedTime(""); }} aria-pressed={selectedDate?.toDateString() === d.toDateString()} className={`shrink-0 px-4 py-2 rounded-xl border text-xs font-bold transition ${selectedDate?.toDateString() === d.toDateString() ? "bg-kabuki-red border-kabuki-red text-white shadow-lg" : "bg-neutral-800 border-neutral-700 text-gray-400"}`}>{d.toLocaleDateString(lang, { day: 'numeric', month: 'short' })}</button>
                            ))}
                          </div>
                        </fieldset>

                        <fieldset className="space-y-2">
                          <legend className="text-[10px] font-bold text-kabuki-red uppercase flex items-center gap-2 mb-2"><Clock size={12} aria-hidden="true" /> {t.time}</legend>
                          <div className="grid grid-cols-4 gap-2">
                            {availableSlots.map(s => <button key={s} type="button" onClick={() => setSelectedTime(s)} aria-pressed={selectedTime === s} className={`py-2 rounded-lg border text-xs font-bold transition ${selectedTime === s ? "bg-kabuki-red border-kabuki-red text-white shadow-md" : "bg-neutral-800 border-neutral-700 text-gray-400"}`}>{s}</button>)}
                          </div>
                        </fieldset>

                        <div role="radiogroup" aria-label={t.pickupMode} className="grid grid-cols-2 gap-3">
                          <button type="button" role="radio" aria-checked={formData.type !== "Livraison"} onClick={() => setFormData({...formData, type: "Click & Collect"})} className={`py-3 rounded-xl border text-xs font-bold transition ${formData.type !== "Livraison" ? "bg-kabuki-red border-kabuki-red text-white shadow-md" : "bg-black border-neutral-800 text-gray-400"}`}>{t.takeaway}</button>
                          <button type="button" role="radio" aria-checked={formData.type === "Livraison"} onClick={() => setFormData({...formData, type: "Livraison"})} className={`py-3 rounded-xl border text-xs font-bold transition ${formData.type === "Livraison" ? "bg-kabuki-red border-kabuki-red text-white shadow-md" : "bg-black border-neutral-800 text-gray-400"}`}>{t.delivery}</button>
                        </div>

                        <AnimatePresence>
                          {formData.type === "Livraison" && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                              {totalPrice < 25 && (
                                <div role="alert" className="bg-red-900/20 text-red-500 text-[10px] font-black p-3 rounded-xl border border-red-500/20 text-center uppercase tracking-widest">
                                  ⚠️ {t.minOrderError}
                                </div>
                              )}
                              <div className="space-y-3 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 shadow-inner">
                                <label htmlFor="delivery_address" className="text-[10px] font-bold text-kabuki-red uppercase flex items-center gap-2"><MapPin size={12} aria-hidden="true" /> {t.address}</label>
                                <input id="delivery_address" required={formData.type === "Livraison"} placeholder={t.addressPlaceholder} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-black text-white border border-neutral-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-kabuki-red transition" />
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <input 
                                    id="zip_code" 
                                    required={formData.type === "Livraison"} 
                                    placeholder={t.zip} 
                                    value={formData.zip} 
                                    onChange={e => setFormData({...formData, zip: e.target.value})} 
                                    maxLength={4}
                                    className={`w-full bg-black text-white border rounded-lg px-4 py-2 text-sm outline-none transition ${formData.zip.length === 4 && !isGenevaZip(formData.zip) ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "border-neutral-800 focus:border-kabuki-red"}`} 
                                  />
                                  <input 
                                    id="floor_number" 
                                    placeholder={t.floorPlaceholder} 
                                    value={formData.floor} 
                                    onChange={e => setFormData({...formData, floor: e.target.value})} 
                                    className="w-full bg-black text-white border border-neutral-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-kabuki-red transition" 
                                  />
                                </div>
                                
                                <AnimatePresence>
                                  {formData.type === "Livraison" && formData.zip.length === 4 && !isGenevaZip(formData.zip) && (
                                    <motion.p 
                                      initial={{ opacity: 0, height: 0 }} 
                                      animate={{ opacity: 1, height: "auto" }} 
                                      exit={{ opacity: 0, height: 0 }} 
                                      className="text-red-500 text-[10px] font-bold mt-1 text-center uppercase"
                                    >
                                      Nous livrons uniquement dans le canton de Genève (12xx).
                                    </motion.p>
                                  )}
                                </AnimatePresence>

                                <input id="door_code" placeholder={t.codePlaceholder} value={formData.doorCode} onChange={e => setFormData({...formData, doorCode: e.target.value})} className="w-full bg-black text-white border border-neutral-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-kabuki-red transition" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="space-y-1">
                          <label htmlFor="order_comments" className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2"><MessageSquare size={12} aria-hidden="true" /> {t.comments}</label>
                          <textarea id="order_comments" value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} className="w-full bg-black text-white border border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-kabuki-red transition h-20 resize-none text-sm" placeholder={t.commentsPlaceholder} />
                        </div>
                      </form>
                    )
                  }
                </div>
                {items.length > 0 && (
                  <div className="p-6 border-t border-neutral-800 bg-neutral-900 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                    <div className="space-y-2 mb-4">
                      {appliedCoupon && (
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-gray-500">{t.totalEstimated}</span>
                          <span className="text-gray-500 line-through">{totalPrice.toFixed(2)} CHF</span>
                        </div>
                      )}
                      {appliedCoupon && (
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-green-500">
                          <span>{t.discount} ({appliedCoupon.code})</span>
                          <span>-{discountAmount.toFixed(2)} CHF</span>
                        </div>
                      )}

                      {/* ✅ NOUVEAU : AFFICHAGE DE LA CAGNOTTE */}
                      {profile && profile.wallet_balance > 0 && (
                        <div className="py-3 px-4 bg-black/40 border border-kabuki-red/30 rounded-xl my-3">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                checked={useWallet} 
                                onChange={(e) => setUseWallet(e.target.checked)}
                                className="accent-kabuki-red w-4 h-4 cursor-pointer"
                              />
                              <span className="text-xs font-bold text-white uppercase tracking-widest">
                                Utiliser ma cagnotte ({Number(profile.wallet_balance).toFixed(2)} CHF)
                              </span>
                            </div>
                            {useWallet && <span className="text-kabuki-red font-bold text-xs">-{walletUsed.toFixed(2)} CHF</span>}
                          </label>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total final</span>
                        <span className="text-2xl font-display font-bold text-white">{finalPrice.toFixed(2)} CHF</span>
                      </div>

                      {/* ✅ NOUVEAU : APERÇU DU GAIN DE CASHBACK */}
                      {user && finalPrice > 0 && (
                        <p className="text-center text-[10px] text-green-500 font-bold uppercase tracking-widest mt-2">
                          + {earnedCashback.toFixed(2)} CHF crédités sur votre cagnotte !
                        </p>
                      )}
                    </div>
                    
                    {!isCheckout ? (
                      <button onClick={() => setIsCheckout(true)} className="w-full bg-kabuki-red text-white font-bold py-4 rounded-xl uppercase flex items-center justify-center gap-2 hover:bg-red-700 transition shadow-lg shadow-red-900/30">
                        {t.btnValidate} <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    ) : (
                      <button type="submit" form="checkout-form" disabled={!isFormReady || isSubmitting} className={`w-full font-bold py-4 rounded-xl uppercase flex items-center justify-center gap-2 transition-all ${isFormReady && !isSubmitting ? "bg-kabuki-red text-white hover:bg-red-700 shadow-lg shadow-red-900/30" : "bg-neutral-800 text-neutral-500 cursor-not-allowed"}`}>
                        {isSubmitting ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> {t.sending}</> : <><ShieldCheck size={18} aria-hidden="true" /> Continuer vers le paiement</>}</button>
                    )}
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