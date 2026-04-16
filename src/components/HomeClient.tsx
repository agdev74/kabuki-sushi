"use client";

import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useTranslation } from "@/context/LanguageContext";

// ✅ On garde l'interface mais on va l'utiliser correctement plus bas
interface Testimonial {
  text: string;
  name: string;
  role: string;
}

export default function HomeClient() {
  const { t, lang } = useTranslation();

  return (
    <div className="min-h-screen bg-[#080808]">
      
      {/* --- HERO SECTION : VERSION TURBO --- */}
      <section className="relative min-h-150 h-[85vh] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          {/* Spotlight CSS ultra-léger */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a1a1a_0%,#000000_100%)]" />
          <div className="absolute inset-0 bg-[url('/pattern-kimono.png')] opacity-[0.02] pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-t from-[#080808] via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <Reveal delay={0.1}>
            <p className="text-kabuki-red font-bold tracking-[0.3em] uppercase mb-4 text-sm md:text-base">
              {t.hero.subtitle}
            </p>
          </Reveal>

          {/* 🚀 CRUCIAL : Pas de <Reveal> ici pour un LCP (chargement) instantané */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-8 uppercase leading-none tracking-tighter">
            {t.hero.title_top} <br/> 
            <span className="text-gray-500">
              {t.hero.title_bottom}
            </span>
          </h1>

          <Reveal delay={0.2}>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light italic">
              {t.hero.desc}
            </p>
          </Reveal>
          
          <Reveal delay={0.3} y={20}>
            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <Link 
                href={`/${lang}/menu`} 
                className="px-10 py-5 bg-kabuki-red text-white font-bold rounded-2xl hover:bg-red-700 transition-all uppercase tracking-widest shadow-xl shadow-red-900/20"
              >
                {t.hero.btnMenu}
              </Link>
              <Link 
                href={`/${lang}/traiteur`} 
                className="px-10 py-5 bg-transparent border border-white/10 text-white font-bold rounded-2xl hover:bg-white hover:text-black transition-all uppercase tracking-widest backdrop-blur-sm"
              >
                {t.hero.btnTraiteur}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --- AVIS CLIENTS --- */}
      <section className="py-24 relative bg-[#080808]">
        <div className="container mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-kabuki-red font-bold tracking-widest uppercase text-sm">{t.testimonials.subtitle}</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mt-2">{t.testimonials.title}</h2>
              <div className="w-20 h-1 bg-neutral-800 mx-auto mt-6"></div>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {/* ✅ Utilisation de l'interface Testimonial ici pour corriger l'erreur ESLint */}
            {t.testimonials.items.map((avis: Testimonial, index: number) => (
              <Reveal key={index} delay={index * 0.1} y={20}>
                <div className="bg-neutral-900/40 backdrop-blur-md p-8 rounded-3xl border border-neutral-800 hover:border-kabuki-red/50 transition-all duration-500 group h-full">
                   <p className="text-gray-300 italic mb-6 text-sm">{avis.text}</p>
                   <div className="border-t border-neutral-800 pt-4">
                      <h3 className="text-white font-bold font-display">{avis.name}</h3>
                      <span className="text-[10px] text-kabuki-red font-bold uppercase tracking-widest">{avis.role}</span>
                   </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}