"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "@/context/LanguageContext"; 
import { z } from "zod"; // ✅ Validation de sécurité

// ✅ Définition du schéma de validation (Anti-injection et formatage)
const cateringSchema = z.object({
  name: z.string().min(2, "Le nom est trop court").max(50),
  email: z.string().email("Format d'email invalide"),
  type: z.string().min(1, "Veuillez choisir un type"),
  guests: z.preprocess(
    (val) => Number(val), 
    z.number().min(1, "Minimum 1 personne").max(1000)
  ),
  vision: z.string().min(10, "Détaillez un peu plus votre projet (min. 10 caract.)").max(2000),
});

interface CateringBloc {
  tag: string;
  title: string;
  desc: string;
}

export default function TraiteurPage() {
  const { t } = useTranslation(); 
  
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({}); // ✅ Gestion des erreurs UI

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({}); // Reset des erreurs précédentes
    
    // Extraction des données via FormData
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      type: formData.get("type"),
      guests: formData.get("guests"),
      vision: formData.get("vision"),
    };

    // ✅ Validation avec Zod
    const result = cateringSchema.safeParse(data);

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        // ✅ Correction TypeScript : Conversion explicite du path en string
        const fieldName = String(issue.path[0]);
        formattedErrors[fieldName] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setFormStatus("submitting");

    // Simulation d'envoi sécurisé
    setTimeout(() => {
      setFormStatus("success");
      window.location.href = "#devis"; 
    }, 2000);
  }

  const experienceImages = [
    "/images/traiteur-chef.jpg",
    "/images/traiteur-frais.jpg",
    "/images/plateau-sushi-1.jpg"
  ];

  return (
    <div className="bg-white min-h-screen pb-20">
      
      {/* --- HERO TRAITEUR --- */}
      <section className="bg-kabuki-black text-white py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-kabuki-red/10 skew-x-12 transform translate-x-20"></div>
        
        <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="md:w-1/2 space-y-6"
          >
            <h1 className="text-4xl lg:text-6xl font-display font-bold uppercase leading-tight">
              {t.catering.title.split(' ')[0]} <br/> 
              <span className="text-kabuki-red">
                {t.catering.title.split(' ').slice(1).join(' ')}
              </span>
            </h1>
            <p className="text-gray-300 text-lg">
              {t.catering.subtitle} <br/>
              {t.catering.desc}
            </p>
            <a href="#devis" className="inline-block bg-white text-kabuki-black px-8 py-3 rounded-full font-bold hover:bg-kabuki-red hover:text-white transition shadow-lg hover:shadow-red-900/50">
              {t.catering.btnHero}
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="md:w-1/2 h-64 md:h-96 relative rounded-lg overflow-hidden shadow-2xl border border-gray-700 group"
          >
             <Image 
                src="/images/traiteur-hero.jpg"
                alt="Buffet Traiteur Kabuki"
                fill
                className="object-cover group-hover:scale-105 transition duration-700"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
          </motion.div>
        </div>
      </section>

     {/* --- L'EXPÉRIENCE KABUKI --- */}
      <section className="py-24 bg-neutral-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-kabuki-red/5 text-[10rem] font-display font-bold whitespace-nowrap select-none z-0">
          KABUKI CATERING
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-display uppercase tracking-wider">
              {t.catering.experienceTitle}
            </h2>
            <div className="w-24 h-1 bg-kabuki-red mx-auto mt-6"></div>
          </motion.div>

          <div className="space-y-24">
            {t.catering.blocs.map((bloc: CateringBloc, index: number) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid md:grid-cols-2 gap-12 items-center"
              >
                <div className={`relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl transition duration-500 border border-neutral-800 
                  ${index % 2 === 0 ? "md:-rotate-2 hover:rotate-0" : "order-1 md:order-2 md:rotate-2 hover:rotate-0"}`}
                >
                  <Image src={experienceImages[index]} alt={bloc.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-kabuki-black/80 via-transparent to-transparent"></div>
                </div>
                <div className={`space-y-6 ${index % 2 === 0 ? "md:pl-12" : "md:pr-12 order-2 md:order-1"}`}>
                  <div className="text-kabuki-red font-display text-2xl font-bold">{bloc.tag}</div>
                  <h3 className="text-3xl font-bold">{bloc.title}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">{bloc.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FORMULAIRE DEVIS --- */}
      <section id="devis" className="bg-kabuki-black py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern-kimono.png')] opacity-5 z-0"></div>

        <div className="container mx-auto px-6 relative z-10 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-neutral-900/80 backdrop-blur-md p-10 md:p-16 rounded-3xl shadow-2xl border border-neutral-800"
          >
            {formStatus === "success" ? (
              <div className="text-center py-10 animate-fade-in-up">
                <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto mb-8">
                  <Image 
                    src="/images/success-man.png" 
                    alt="Succès"
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>

                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                  {t.catering.formSection.successTitle}
                </h2>
                <p className="text-gray-300 text-lg max-w-xl mx-auto mb-8">
                  {t.catering.formSection.successDesc}
                </p>
                <button 
                  onClick={() => setFormStatus("idle")}
                  className="text-kabuki-red font-bold uppercase tracking-widest hover:text-white transition border-b border-kabuki-red pb-1"
                >
                  {t.catering.formSection.successBtn}
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-5xl font-bold text-white font-display uppercase tracking-wider mb-4">
                    {t.catering.formSection.title}
                  </h2>
                  <div className="w-16 h-1 bg-kabuki-red mx-auto"></div>
                  <p className="text-gray-400 mt-6 text-lg">{t.catering.formSection.subtitle}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-kabuki-red tracking-widest uppercase">{t.catering.formSection.name}</label>
                      <input 
                        name="name" 
                        type="text" 
                        className={`w-full bg-neutral-800 text-white border-b-2 ${errors.name ? 'border-kabuki-red' : 'border-neutral-700'} focus:border-kabuki-red px-4 py-3 rounded-t-lg outline-none transition-all placeholder-gray-500`} 
                        placeholder="..." 
                      />
                      {errors.name && <p className="text-kabuki-red text-[10px] font-bold uppercase mt-1">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-kabuki-red tracking-widest uppercase">{t.catering.formSection.email}</label>
                      <input 
                        name="email" 
                        type="email" 
                        className={`w-full bg-neutral-800 text-white border-b-2 ${errors.email ? 'border-kabuki-red' : 'border-neutral-700'} focus:border-kabuki-red px-4 py-3 rounded-t-lg outline-none transition-all placeholder-gray-500`} 
                        placeholder="..." 
                      />
                      {errors.email && <p className="text-kabuki-red text-[10px] font-bold uppercase mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-kabuki-red tracking-widest uppercase">{t.catering.formSection.type}</label>
                      <select name="type" className="w-full bg-neutral-800 text-white border-b-2 border-neutral-700 focus:border-kabuki-red px-4 py-3 rounded-t-lg outline-none appearance-none cursor-pointer">
                        {t.catering.formSection.types.map((type: string) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-kabuki-red tracking-widest uppercase">{t.catering.formSection.guests}</label>
                      <input 
                        name="guests" 
                        type="number" 
                        className={`w-full bg-neutral-800 text-white border-b-2 ${errors.guests ? 'border-kabuki-red' : 'border-neutral-700'} focus:border-kabuki-red px-4 py-3 rounded-t-lg outline-none transition-all placeholder-gray-500`} 
                        placeholder="Ex: 80" 
                      />
                      {errors.guests && <p className="text-kabuki-red text-[10px] font-bold uppercase mt-1">{errors.guests}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-kabuki-red tracking-widest uppercase">{t.catering.formSection.vision}</label>
                    <textarea 
                      name="vision" 
                      rows={5} 
                      className={`w-full bg-neutral-800 text-white border-b-2 ${errors.vision ? 'border-kabuki-red' : 'border-neutral-700'} focus:border-kabuki-red px-4 py-3 rounded-t-lg outline-none transition-all placeholder-gray-500 resize-none`} 
                      placeholder={t.catering.formSection.visionPlaceholder}
                    ></textarea>
                    {errors.vision && <p className="text-kabuki-red text-[10px] font-bold uppercase mt-1">{errors.vision}</p>}
                  </div>

                  <div className="text-center pt-6">
                    <button 
                      type="submit" 
                      disabled={formStatus === "submitting"}
                      className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-kabuki-red px-12 py-4 font-bold text-white transition-all hover:scale-105 box-shadow-xl hover:shadow-red-900/50 disabled:opacity-50"
                    >
                      {formStatus === "submitting" ? (
                        <span className="flex items-center">
                           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                           {t.catering.formSection.sending}
                        </span>
                      ) : (
                        <span className="relative tracking-widest uppercase text-lg">{t.catering.formSection.submit}</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </section>

    </div>
  );
}