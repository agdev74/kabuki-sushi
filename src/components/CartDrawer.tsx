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

// Initialisation de Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const cartTranslations = {
  fr: {
    titleCart: "Mon Panier",
    titleCheckout: "Validation",
    titlePayment: "Paiement Sécurisé",
    emptyCart: "Votre panier est vide",
    items: "article",
    itemsPlural: "articles",
    clearCart: "Vider le panier",
    name: "Nom Complet *",
    namePlaceholder: "Jean Dupont",
    phone: "Téléphone *",
    date: "Date de retrait/livraison *",
    time: "Heure souhaitée *",
    pickupMode: "Mode de retrait *",
    takeaway: "À Emporter",
    delivery: "Livraison",
    address: "Adresse *",
    addressPlaceholder: "Rue des Alpes 12",
    zip: "NPA *",
    floor: "Étage",
    floorPlaceholder: "Ex: 4",
    code: "Code",
    codePlaceholder: "Ex: A123",
    comments: "Instructions / Allergies",
    commentsPlaceholder: "Sans wasabi, allergie au sésame...",
    totalEstimated: "Total à payer",
    btnValidate: "Passer à la caisse",
    btnPay: "Payer la commande",
    minOrderError: "Minimum de 25 CHF requis pour la livraison.",
    noTimeSlots: "Aucun horaire disponible pour cette date.",
    today: "Aujourd'hui",
    tomorrow: "Demain",
    sending: "Génération du paiement...",
    processing: "Paiement en cours...",
    paymentError: "Le paiement a échoué. Veuillez réessayer.",
    successTitle: "Paiement réussi !",
    successDesc: "Votre commande a été réglée et validée par notre cuisine.",
    btnClose: "Fermer",
    cancelPayment: "Annuler et modifier"
  },
  en: {
    titleCart: "My Cart",
    titleCheckout: "Checkout",
    titlePayment: "Secure Payment",
    emptyCart: "Your cart is empty",
    items: "item",
    itemsPlural: "items",
    clearCart: "Clear cart",
    name: "Full Name *",
    namePlaceholder: "John Doe",
    phone: "Phone *",
    date: "Pickup/Delivery Date *",
    time: "Requested Time *",
    pickupMode: "Pickup Method *",
    takeaway: "Takeaway",
    delivery: "Delivery",
    address: "Address *",
    addressPlaceholder: "12 Alps Street",
    zip: "ZIP Code *",
    floor: "Floor",
    floorPlaceholder: "Ex: 4",
    code: "Door Code",
    codePlaceholder: "Ex: A123",
    comments: "Special Instructions",
    commentsPlaceholder: "No wasabi, sesame allergy...",
    totalEstimated: "Total to pay",
    btnValidate: "Proceed to checkout",
    btnPay: "Pay Order",
    minOrderError: "Minimum 25 CHF required for delivery.",
    noTimeSlots: "No time slots available for this date.",
    today: "Today",
    tomorrow: "Tomorrow",
    sending: "Preparing payment...",
    processing: "Processing...",
    paymentError: "Payment failed. Please try again.",
    successTitle: "Payment successful!",
    successDesc: "Your order has been paid and confirmed by our kitchen.",
    btnClose: "Close",
    cancelPayment: "Cancel and edit order"
  },
  es: {
    titleCart: "Mi Carrito",
    titleCheckout: "Pago",
    titlePayment: "Pago Seguro",
    emptyCart: "Tu carrito está vacío",
    items: "artículo",
    itemsPlural: "artículos",
    clearCart: "Vaciar carrito",
    name: "Nombre Completo *",
    namePlaceholder: "Juan Pérez",
    phone: "Teléfono *",
    date: "Fecha de entrega *",
    time: "Hora deseada *",
    pickupMode: "Método de entrega *",
    takeaway: "Para Llevar",
    delivery: "Entrega a domicilio",
    address: "Dirección *",
    addressPlaceholder: "Calle de los Alpes 12",
    zip: "Código Postal *",
    floor: "Piso",
    floorPlaceholder: "Ej: 4",
    code: "Código de puerta",
    codePlaceholder: "Ej: A123",
    comments: "Instrucciones spéciales",
    commentsPlaceholder: "Sin wasabi, allergia al sésamo...",
    totalEstimated: "Total a pagar",
    btnValidate: "Ir a la caja",
    btnPay: "Pagar pedido",
    minOrderError: "Mínimo de 25 CHF requerido para entrega.",
    noTimeSlots: "No hay horarios disponibles para cette date.",
    today: "Hoy",
    tomorrow: "Mañana",
    sending: "Generando pago...",
    processing: "Procesando...",
    paymentError: "El pago falló. Por favor, inténtelo de nouveau.",
    successTitle: "¡Pago exitoso!",
    successDesc: "Su pedido ha sido pagado et confirmé par notre cuisine.",
    btnClose: "Cerrar",
    cancelPayment: "Cancelar y editar pedido"
  }
};

const generateAvailableDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 1) days.push(d); 
  }
  return days;
};

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StripeCheckoutFormProps {
  total: number;
  onSuccess: () => void;
  onCancel: () => void;
  t: Record<string, string>;
}

// ============================================================================
// SOUS-COMPOSANT : FORMULAIRE DE PAIEMENT STRIPE
// ============================================================================
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

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required", 
    });

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
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3 text-green-500 mb-6">
          <ShieldCheck size={24} />
          <p className="text-xs font-bold uppercase tracking-widest">Connexion chiffrée SSL</p>
        </div>
        <PaymentElement options={{ layout: "tabs" }} />
        {errorMessage && (
          <div className="text-red-500 text-xs font-bold bg-red-900/20 p-3 rounded-xl border border-red-900/30">
            ⚠️ {errorMessage}
          </div>
        )}
      </div>
      <div className="p-6 border-t border-neutral-800 bg-neutral-900 shrink-0 space-y-3">
        <button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className={`w-full font-bold py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-lg ${
            isProcessing ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700 shadow-green-900/20"
          }`}
        >
          {isProcessing ? <><Loader2 size={18} className="animate-spin" /> {t.processing}</> : `${t.btnPay} (${total.toFixed(2)} CHF)`}
        </button>
        <button type="button" onClick={onCancel} disabled={isProcessing} className="w-full text-gray-500 text-[10px] font-bold hover:text-white uppercase tracking-widest py-2 transition">
          {t.cancelPayment}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL : CART DRAWER
// ============================================================================
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

  const MIN_DELIVERY_AMOUNT = 25;
  const [formData, setFormData] = useState({
    name: "", phone: "", type: "Click & Collect", 
    address: "", zip: "", floor: "", doorCode: "", comments: "",
  });

  const [availableDays] = useState<Date[]>(generateAvailableDays);
  const [selectedDate, setSelectedDate] = useState<Date | null>(availableDays.length > 0 ? availableDays[0] : null);
  const [selectedTime, setSelectedTime] = useState<string>("");

  const generateTimeSlots = (date: Date) => {
    if (!date) return [];
    const day = date.getDay();
    const slots: string[] = [];
    if (day >= 2 && day <= 5) {
      slots.push("11:30", "12:00", "12:30", "13:00", "13:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00");
    } else if (day === 0 || day === 6) {
      slots.push("18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00");
    }
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      const currentTimeVal = now.getHours() + now.getMinutes() / 60;
      return slots.filter(slot => {
        const [h, m] = slot.split(':').map(Number);
        return (h + m / 60) > (currentTimeVal + 0.5);
      });
    }
    return slots;
  };

  const availableSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  const getDayLabel = (d: Date) => {
    const today = new Date();
    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return t.today;
    if (d.toDateString() === tomorrow.toDateString()) return t.tomorrow;
    const formatted = new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const isDelivery = formData.type === "Livraison";
  const isDeliveryValid = !isDelivery || totalPrice >= MIN_DELIVERY_AMOUNT;
  const isFormReady = isDeliveryValid && selectedDate !== null && selectedTime !== "";

  const handlePreparePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormReady) return;
    setIsSubmitting(true);
    try {
      const cleanItems = items.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity }));
      const { data, error } = await supabase.from('orders').insert([{
        customer_name: formData.name,
        customer_phone: formData.phone,
        pickup_date: selectedDate ? selectedDate.toISOString().split('T')[0] : null,
        pickup_time: selectedTime,
        order_type: formData.type,
        delivery_address: isDelivery ? formData.address : null,
        delivery_zip: isDelivery ? formData.zip : null,
        delivery_floor: isDelivery ? formData.floor : null,
        delivery_code: isDelivery ? formData.doorCode : null,
        special_instructions: formData.comments,
        total_amount: totalPrice,
        items: cleanItems,
        status: "En attente de paiement"
      }]).select();
      if (error) throw error;
      const newOrderId = data[0].id;
      setOrderId(newOrderId);
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalPrice, orderId: newOrderId }),
      });
      const paymentData = await res.json();
      if (paymentData.error) throw new Error(paymentData.error);
      setClientSecret(paymentData.clientSecret);
      setIsPayment(true);
    // ✅ FIX ESLINT : Plus de "any", on cast l'erreur proprement
    } catch (err) {
      const error = err as Error;
      alert(`Erreur : ${error.message || "Impossible de contacter la banque."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setIsPayment(false);
    setIsSuccess(true);
  };

  const handleCloseSuccess = () => {
    setIsSuccess(false);
    setIsCheckout(false);
    setIsPayment(false);
    setClientSecret(null);
    onClose();
  };

  const stripeOptions = {
    clientSecret: clientSecret || "",
    appearance: {
      theme: 'night' as const,
      variables: { colorPrimary: '#dc2626', colorBackground: '#171717', colorText: '#ffffff', colorDanger: '#ef4444' },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={isSuccess ? handleCloseSuccess : onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-neutral-900 border-l border-neutral-800 shadow-2xl z-[101] flex flex-col">
            {!isSuccess && (
              <div className="flex items-center justify-between p-6 border-b border-neutral-800 shrink-0">
                <h2 className="text-xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-3">
                  {isPayment ? <><ShieldCheck size={20} className="text-green-500" />{t.titlePayment}</> : isCheckout ? <><button onClick={() => setIsCheckout(false)} className="hover:text-kabuki-red transition"><ArrowLeft size={20} /></button>{t.titleCheckout}</> : <><ShoppingBag size={20} className="text-kabuki-red" />{t.titleCart}</>}
                </h2>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-neutral-800 rounded-full transition"><X size={18} /></button>
              </div>
            )}
            {isSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center"><CheckCircle size={48} /></motion.div>
                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-widest">{t.successTitle}</h2>
                <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 w-full">
                  <p className="text-gray-300 text-sm mb-2">{t.successDesc}</p>
                  <p className="text-xl font-bold text-kabuki-red">#KBK-{orderId}</p>
                </div>
                <button onClick={handleCloseSuccess} className="w-full bg-neutral-800 text-white font-bold py-4 rounded-xl uppercase tracking-widest hover:bg-neutral-700 transition">{t.btnClose}</button>
              </div>
            ) : isPayment && clientSecret ? (
              <Elements options={stripeOptions} stripe={stripePromise}>
                <StripeCheckoutForm total={totalPrice} onSuccess={handlePaymentSuccess} onCancel={() => { setIsPayment(false); setClientSecret(null); }} t={t} />
              </Elements>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                      <ShoppingBag size={48} className="opacity-20" /><p className="uppercase tracking-widest text-sm">{t.emptyCart}</p>
                    </div>
                  ) : (
                    <>
                      {!isCheckout ? (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{totalItems} {totalItems > 1 ? t.itemsPlural : t.items}</span>
                            <button onClick={clearCart} className="text-[10px] text-gray-400 hover:text-kabuki-red font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors"><Trash2 size={12} /> {t.clearCart}</button>
                          </div>
                          {items.map((item) => (
                            <div key={item.id} className="flex gap-4 items-center bg-black/40 p-3 rounded-2xl border border-neutral-800/50">
                              <div className="w-16 h-16 relative bg-neutral-800 rounded-xl overflow-hidden shrink-0">{item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-cover" />}</div>
                              <div className="flex-1"><h4 className="text-white font-bold text-sm uppercase line-clamp-1">{item.name}</h4><div className="text-kabuki-red font-bold text-xs mt-1">{(item.price * item.quantity).toFixed(2)} CHF</div></div>
                              <div className="flex items-center gap-3 bg-neutral-800 rounded-full px-2 py-1"><button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-white hover:text-kabuki-red"><Minus size={14} /></button><span className="text-white text-xs font-bold w-4 text-center">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-white hover:text-kabuki-red"><Plus size={14} /></button></div>
                              <button type="button" onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-kabuki-red p-2 transition"><Trash2 size={16} /></button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <form id="checkout-form" onSubmit={handlePreparePayment} className="space-y-6 pb-8">
                          <div className="space-y-4">
                            <div className="space-y-1"><label className="text-[10px] font-bold text-kabuki-red uppercase tracking-widest">{t.name}</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black text-white border border-neutral-800 focus:border-kabuki-red rounded-xl px-4 py-3 outline-none transition" placeholder={t.namePlaceholder} /></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-kabuki-red uppercase tracking-widest">{t.phone}</label><input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black text-white border border-neutral-800 focus:border-kabuki-red rounded-xl px-4 py-3 outline-none transition" placeholder="079..." /></div>
                            <div className="space-y-2 pt-2"><label className="text-[10px] font-bold text-kabuki-red uppercase tracking-widest flex items-center gap-1"><Calendar size={12} /> {t.date}</label><div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">{availableDays.map((d, idx) => { const isSelected = selectedDate?.toDateString() === d.toDateString(); return (<button key={idx} type="button" onClick={() => { setSelectedDate(d); setSelectedTime(""); }} className={`shrink-0 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${isSelected ? "bg-kabuki-red border-kabuki-red text-white shadow-lg shadow-red-900/20" : "bg-neutral-800 border-neutral-700 text-gray-400 hover:text-white"}`}>{getDayLabel(d)}</button>); })}</div></div>
                            <AnimatePresence mode="wait">{selectedDate && (<motion.div key={selectedDate.toISOString()} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2"><label className="text-[10px] font-bold text-kabuki-red uppercase tracking-widest flex items-center gap-1"><Clock size={12} /> {t.time}</label>{availableSlots.length > 0 ? (<div className="grid grid-cols-4 gap-2">{availableSlots.map(slot => (<button key={slot} type="button" onClick={() => setSelectedTime(slot)} className={`py-2 rounded-lg border text-xs font-bold transition-all ${selectedTime === slot ? "bg-kabuki-red border-kabuki-red text-white" : "bg-neutral-800 border-neutral-700 text-gray-400 hover:bg-neutral-700"}`}>{slot}</button>))}</div>) : (<p className="text-red-400 text-xs italic bg-red-900/20 p-3 rounded-lg border border-red-900/30">{t.noTimeSlots}</p>)}</motion.div>)}</AnimatePresence>
                            <div className="space-y-1 pt-2"><label className="text-[10px] font-bold text-kabuki-red uppercase tracking-widest">{t.pickupMode}</label><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setFormData({...formData, type: "Click & Collect"})} className={`py-3 rounded-xl border text-xs font-bold uppercase transition ${!isDelivery ? "bg-kabuki-red border-kabuki-red text-white" : "bg-black border-neutral-800 text-gray-400"}`}>{t.takeaway}</button><button type="button" onClick={() => setFormData({...formData, type: "Livraison"})} className={`py-3 rounded-xl border text-xs font-bold uppercase transition ${isDelivery ? "bg-kabuki-red border-kabuki-red text-white" : "bg-black border-neutral-800 text-gray-400"}`}>{t.delivery}</button></div></div>
                            <AnimatePresence>{isDelivery && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 overflow-hidden pt-2"><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.address}</label><input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-black text-white border border-neutral-800 focus:border-kabuki-red rounded-xl px-4 py-3 outline-none transition" placeholder={t.addressPlaceholder} /></div><div className="grid grid-cols-3 gap-3"><div className="space-y-1 col-span-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.zip}</label><input required type="text" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} className="w-full bg-black text-white border border-neutral-800 focus:border-kabuki-red rounded-xl px-4 py-3 outline-none transition" placeholder="1201" /></div><div className="space-y-1 col-span-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.floor}</label><input type="text" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} className="w-full bg-black text-white border border-neutral-800 focus:border-kabuki-red rounded-xl px-4 py-3 outline-none transition" placeholder={t.floorPlaceholder} /></div><div className="space-y-1 col-span-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.code}</label><input type="text" value={formData.doorCode} onChange={e => setFormData({...formData, doorCode: e.target.value})} className="w-full bg-black text-white border border-neutral-800 focus:border-kabuki-red rounded-xl px-4 py-3 outline-none transition" placeholder={t.codePlaceholder} /></div></div></motion.div>)}</AnimatePresence>
                            <div className="space-y-1 pt-4 border-t border-neutral-800"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><MessageSquare size={12} /> {t.comments}</label><textarea value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} className="w-full bg-black text-white border border-neutral-800 focus:border-kabuki-red rounded-xl px-4 py-3 outline-none transition resize-none h-20 text-sm" placeholder={t.commentsPlaceholder} /></div>
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </div>
                {items.length > 0 && (
                  <div className="p-6 border-t border-neutral-800 bg-neutral-900 shrink-0">
                    <div className="flex justify-between items-center mb-4"><span className="text-gray-400 uppercase tracking-widest text-xs font-bold">{t.totalEstimated}</span><span className="text-2xl font-bold text-white font-display">{totalPrice.toFixed(2)} <span className="text-kabuki-red text-sm">CHF</span></span></div>
                    {isCheckout && isDelivery && !isDeliveryValid && (<div className="text-kabuki-red text-[10px] font-bold text-center mb-4 bg-kabuki-red/10 py-2 rounded-lg border border-kabuki-red/30">⚠️ {t.minOrderError}</div>)}
                    {!isCheckout ? (<button onClick={() => setIsCheckout(true)} className="w-full bg-kabuki-red text-white font-bold py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700 transition shadow-lg shadow-red-900/20">{t.btnValidate} <ArrowRight size={16} /></button>) : (<button type="submit" form="checkout-form" disabled={!isFormReady || isSubmitting} className={`w-full font-bold py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-lg ${isFormReady && !isSubmitting ? "bg-kabuki-red text-white hover:bg-red-700 shadow-red-900/20" : "bg-neutral-800 text-neutral-500 cursor-not-allowed"}`}>{isSubmitting ? <><Loader2 size={18} className="animate-spin" /> {t.sending}</> : <><ShieldCheck size={18} /> Continuer vers le paiement</>}</button>)}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}