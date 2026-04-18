"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion"; // ✅ Utilisation de 'm' (Lazy)
import { 
  Phone, MapPin, Send, Loader2, CheckCircle, 
  Users, Calendar, Clock, ArrowRight 
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { useTranslation } from "@/context/LanguageContext";
import { z } from "zod";

// ✅ Schéma de validation
const contactSchema = z.object({
  name: z.string().min(2, "Le nom est trop court").max(50),
  email: z.string().email("Email invalide"),
  subject: z.string(),
  phone: z.string().optional(),
  message: z.string().min(10, "Message trop court (min. 10 caract.)").max(2000),
  date: z.string().optional(),
  guests: z.preprocess((val) => (val === "" ? undefined : Number(val)), z.number().optional()),
});

export default function ContactPage() {
  const { t, lang } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const googleMapsUrl = "https://maps.google.com"; // À mettre à jour avec ton lien réel
  const mapEmbedUrl = "https://www.google.com/maps/embed?..."; // À mettre à jour

  const findUsLabel = { fr: "Trouvez-nous", en: "Find us", es: "Encuéntranos" }[lang as "fr" | "en" | "es"] || "Trouvez-nous";
  
  const days = {
    fr: { mon: "Lundi", tueFri: "Mardi - Vendredi", satSun: "Samedi - Dimanche", closed: "Fermé", midi: "Midi", soir: "Soir" },
    en: { mon: "Monday", tueFri: "Tuesday - Friday", satSun: "Saturday - Sunday", closed: "Closed", midi: "Lunch", soir: "Dinner" },
    es: { mon: "Lunes", tueFri: "Martes - Viernes", satSun: "Sábado - Domingo", closed: "Cerrado", midi: "Mediodía", soir: "Noche" }
  }[lang as "fr" | "en" | "es"] || { mon: "Lundi", tueFri: "Mardi - Vendredi", satSun: "Samedi - Dimanche", closed: "Fermé", midi: "Midi", soir: "Soir" };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", subject: "Général", phone: "", date: "", guests: "", message: ""
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        formattedErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(formattedErrors);

      const firstErrorField = String(result.error.issues[0].path[0]);
      const element = document.getElementsByName(firstErrorField)[0];
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => element.focus(), 500);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSent(true);
        setFormData({ name: "", email: "", subject: "Général", phone: "", date: "", guests: "", message: "" });
        setTimeout(() => setIsSent(false), 5000);
      } else {
        const errorData = await response.json();
        alert("Erreur : " + errorData.message);
      }
    } catch { 
      alert("Une erreur réseau est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-neutral-900 min-h-screen">
      
      {/* --- HERO HEADER --- */}
      <div className="bg-black text-white pt-24 md:pt-32 pb-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern-kimono.png')] opacity-5 z-0" aria-hidden="true"></div>
        <Reveal>
          <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-widest relative z-10">
            {t.contact.title}
          </h1>
          <p className="text-gray-400 mt-4 text-sm md:text-base relative z-10 max-w-xl mx-auto px-6 italic">
            {t.contact.subtitle}
          </p>
          <div className="w-16 h-1 bg-kabuki-red mx-auto mt-8 relative z-10"></div>
        </Reveal>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          
          <div className="space-y-12">
            <Reveal x={-30}>
              <div className="flex gap-6 items-start group">
                <div className="w-14 h-14 bg-neutral-800 rounded-2xl flex items-center justify-center text-kabuki-red border border-neutral-700 group-hover:bg-kabuki-red group-hover:text-white transition-all shadow-xl shrink-0">
                  <MapPin size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-wide">{t.contact.address}</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Kabuki Sushi Genève<br />
                    1 Boulevard de la Tour<br />
                    1205 Genève, Suisse
                  </p>
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 text-kabuki-red hover:text-white transition font-bold text-xs uppercase tracking-widest">
                    {findUsLabel} <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal x={-30} delay={0.2}>
              <div className="flex gap-6 items-start group">
                <div className="w-14 h-14 bg-neutral-800 rounded-2xl flex items-center justify-center text-kabuki-red border border-neutral-700 group-hover:bg-kabuki-red group-hover:text-white transition-all shadow-xl shrink-0">
                  <Clock size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-white mb-4 uppercase tracking-wide">{t.contact.opening}</h3>
                  <div className="space-y-4 text-sm text-gray-400 max-w-xs">
                    <div className="border-b border-neutral-800 pb-3">
                      <div className="font-bold text-white mb-1 uppercase text-xs tracking-wider">{days.tueFri}</div>
                      <div className="flex justify-between text-[11px]">
                        <span>{days.midi}</span>
                        <span className="text-white">11:20 - 14:00</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>{days.soir}</span>
                        <span className="text-white">18:00 - 22:30</span>
                      </div>
                    </div>
                    <div className="border-b border-neutral-800 pb-3">
                      <div className="font-bold text-white mb-1 uppercase text-xs tracking-wider">{days.satSun}</div>
                      <div className="flex justify-between text-[11px]">
                        <span>{days.soir}</span>
                        <span className="text-white">18:00 - 22:30</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white uppercase tracking-wider">{days.mon}</span>
                      <span className="text-kabuki-red font-bold uppercase">{days.closed}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal x={-30} delay={0.4}>
              <div className="flex gap-6 items-start group">
                <div className="w-14 h-14 bg-neutral-800 rounded-2xl flex items-center justify-center text-kabuki-red border border-neutral-700 group-hover:bg-kabuki-red group-hover:text-white transition-all shadow-xl shrink-0">
                  <Phone size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-wide">Contact Direct</h3>
                  <p className="text-gray-400">Tél : <a href="tel:+41786767100" className="text-white hover:text-kabuki-red font-bold transition text-lg tracking-tighter">078 676 71 00</a></p>
                  <p className="text-gray-400">Email : <a href="mailto:info@kabuki-sushi.ch" className="text-white hover:text-kabuki-red font-bold transition">info@kabuki-sushi.ch</a></p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal y={30} delay={0.5}>
            <div className="bg-neutral-800/40 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-neutral-700/50 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {!isSent ? (
                  // ✅ CORRECTIF : m.form au lieu de motion.form
                  <m.form 
                    key="contact-form"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onSubmit={handleSubmit} className="space-y-6"
                    style={{ willChange: "transform, opacity" }}
                  >
                    <h3 className="text-2xl font-display font-bold text-white uppercase mb-4">
                        {t.catering.formSection.title}
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t.catering.formSection.name}</label>
                        <input name="name" type="text" autoComplete="name" className={`w-full bg-black/40 text-white border ${errors.name ? 'border-kabuki-red' : 'border-neutral-700'} focus:border-kabuki-red rounded-2xl px-5 py-4 outline-none transition-all shadow-inner`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        {errors.name && <p className="text-kabuki-red text-[9px] font-bold uppercase mt-1">{errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t.catering.formSection.email}</label>
                        <input name="email" type="email" autoComplete="email" className={`w-full bg-black/40 text-white border ${errors.email ? 'border-kabuki-red' : 'border-neutral-700'} focus:border-kabuki-red rounded-2xl px-5 py-4 outline-none transition-all shadow-inner`} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        {errors.email && <p className="text-kabuki-red text-[9px] font-bold uppercase mt-1">{errors.email}</p>}
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sujet</label>
                            <select name="subject" className="w-full bg-black/40 text-white border border-neutral-700 focus:border-kabuki-red rounded-2xl px-5 py-4 outline-none transition appearance-none cursor-pointer" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
                                <option value="Général">Question Générale</option>
                                <option value="Traiteur">Événement & Traiteur</option>
                                <option value="Groupe">Réservation de Groupe</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Téléphone</label>
                            <input name="phone" type="tel" autoComplete="tel" className="w-full bg-black/40 text-white border border-neutral-700 focus:border-kabuki-red rounded-2xl px-5 py-4 outline-none transition shadow-inner" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>

                    <AnimatePresence>
                      {formData.subject === "Traiteur" && (
                        // ✅ CORRECTIF : m.div
                        <m.div 
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="grid md:grid-cols-2 gap-6 overflow-hidden"
                        >
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-kabuki-red uppercase flex items-center gap-2 tracking-widest">
                                <Calendar size={12}/> Date souhaitée
                            </label>
                            <input name="date" type="date" className="w-full bg-black/40 text-white border border-kabuki-red/30 focus:border-kabuki-red rounded-2xl px-5 py-4 outline-none transition" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-kabuki-red uppercase flex items-center gap-2 tracking-widest">
                                <Users size={12}/> Convives
                            </label>
                            <input name="guests" type="number" placeholder="Ex: 25" className="w-full bg-black/40 text-white border border-kabuki-red/30 focus:border-kabuki-red rounded-2xl px-5 py-4 outline-none transition" value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} />
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Message</label>
                      <textarea name="message" rows={4} className={`w-full bg-black/40 text-white border ${errors.message ? 'border-kabuki-red' : 'border-neutral-700'} focus:border-kabuki-red rounded-2xl px-5 py-4 outline-none transition resize-none shadow-inner`} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                      {errors.message && <p className="text-kabuki-red text-[9px] font-bold uppercase mt-1">{errors.message}</p>}
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-kabuki-red text-white font-bold py-5 rounded-2xl hover:bg-red-700 transition shadow-xl uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95">
                      {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={18}/> {t.catering.formSection.submit}</>}
                    </button>
                  </m.form>
                ) : (
                  // ✅ CORRECTIF : m.div
                  <m.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="py-20 text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/10">
                      <CheckCircle size={40} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-display font-bold text-white uppercase tracking-widest mb-2">Message Envoyé</h3>
                        <p className="text-gray-400 italic text-sm max-w-xs mx-auto">
                            Arigato ! Notre équipe Kabuki reviendra vers vous très rapidement.
                        </p>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="w-full h-450px bg-neutral-800 border-t border-neutral-800 relative">
        <iframe 
          src={mapEmbedUrl}
          title="Plan d'accès Kabuki Sushi"
          width="100%" 
          height="100%" 
          style={{border:0}} 
          allowFullScreen={true} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          className="filter grayscale contrast-125 brightness-75 opacity-60 hover:opacity-100 transition-all duration-1000"
        ></iframe>
      </div>
    </div>
  );
}