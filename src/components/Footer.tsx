"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";

export default function Footer() {
  const { t, lang } = useTranslation();

  // Variables pour la traduction rapide des jours
  const days = {
    fr: { mon: "Lundi", tueFri: "Mardi - Vendredi", satSun: "Samedi - Dimanche", closed: "Fermé" },
    en: { mon: "Monday", tueFri: "Tuesday - Friday", satSun: "Saturday - Sunday", closed: "Closed" },
    es: { mon: "Lunes", tueFri: "Martes - Viernes", satSun: "Sábado - Domingo", closed: "Cerrado" }
  }[lang as "fr" | "en" | "es"] || { mon: "Lundi", tueFri: "Mardi - Vendredi", satSun: "Samedi - Dimanche", closed: "Fermé" };

  return (
    <footer className="bg-kabuki-black text-white border-t border-neutral-800 pt-16 pb-8">
      <div className="container mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* COLONNE 1 : LOGO & DESCRIPTION */}
          <div className="space-y-6">
            <Link href={`/${lang}`} className="inline-block w-32">
              <Image 
                src="/images/logo.png" 
                alt="Kabuki Sushi Logo" 
                width={150} 
                height={150} 
                className="w-full h-auto"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t.footer.desc}
            </p>
          </div>

          {/* COLONNE 2 : LIENS RAPIDES */}
          <div>
            <h3 className="text-lg font-display font-bold uppercase tracking-widest mb-6 border-l-4 border-kabuki-red pl-3">
              {t.footer.linksTitle}
            </h3>
            <ul className="space-y-3 text-gray-400">
              <li><Link href={`/${lang}`} className="hover:text-kabuki-red transition">{t.nav.home}</Link></li>
              <li><Link href={`/${lang}/menu`} className="hover:text-kabuki-red transition">{t.nav.menu}</Link></li>
              <li><Link href={`/${lang}/traiteur`} className="hover:text-kabuki-red transition">{t.nav.catering}</Link></li>
              <li><Link href={`/${lang}/contact`} className="hover:text-kabuki-red transition">{t.nav.contact}</Link></li>
            </ul>
          </div>

          {/* COLONNE 3 : CONTACT */}
          <div>
            <h3 className="text-lg font-display font-bold uppercase tracking-widest mb-6 border-l-4 border-kabuki-red pl-3">
              {t.footer.contactTitle}
            </h3>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start">
                <span className="text-kabuki-red mr-3">📍</span>
                <span>1 Boulevard de la Tour,<br/>1205 Genève, Suisse</span>
              </li>
              <li className="flex items-center">
                <span className="text-kabuki-red mr-3">📞</span>
                <a href="tel:+41786041542" className="hover:text-white transition font-bold tracking-tighter">
                  +41 78 604 15 42
                </a> 
              </li>
            </ul>
          </div>

          {/* COLONNE 4 : HORAIRES */}
          <div>
            <h3 className="text-lg font-display font-bold uppercase tracking-widest mb-6 border-l-4 border-kabuki-red pl-3">
              {t.contact.opening}
            </h3>
            <ul className="space-y-4 text-gray-400 text-xs uppercase tracking-widest">
              <li className="flex flex-col gap-1">
                <span className="text-white font-bold">{days.tueFri}</span>
                <div className="flex justify-between text-[10px]">
                  <span>Midi</span>
                  <span>11:20 - 14:00</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Soir</span>
                  <span>18:00 - 22:30</span>
                </div>
              </li>

              <li className="flex flex-col gap-1 border-t border-neutral-800 pt-3">
                <span className="text-white font-bold">{days.satSun}</span>
                <div className="flex justify-between text-[10px]">
                  <span>Soir</span>
                  <span>18:00 - 22:30</span>
                </div>
              </li>

              <li className="flex justify-between border-t border-neutral-800 pt-3 text-kabuki-red font-bold">
                <span>{days.mon}</span>
                <span>{days.closed}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* COPYRIGHT & LÉGAL */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Kabuki Sushi Genève. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {/* ✅ LIEN MIS À JOUR ET DÉSACTIVATION DU "AVISO LEGAL" SI PAS EN ESPAGNOL */}
            <Link 
              href={`/${lang}/mentions-legales`} 
              className="hover:text-white transition font-bold"
            >
              {lang === "fr" ? "Mentions Légales" : lang === "en" ? "Legal Notice" : "Aviso Legal"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}