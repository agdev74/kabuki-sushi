"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";
import { Instagram, Facebook, MapPin, Phone, Globe } from "lucide-react"; // ✅ Import des icônes

export default function Footer() {
  const { t, lang } = useTranslation();

  const days = {
    fr: { mon: "Lundi", tueFri: "Mardi - Vendredi", satSun: "Samedi - Dimanche", closed: "Fermé", midi: "Midi", soir: "Soir" },
    en: { mon: "Monday", tueFri: "Tuesday - Friday", satSun: "Saturday - Sunday", closed: "Closed", midi: "Lunch", soir: "Dinner" },
    es: { mon: "Lunes", tueFri: "Martes - Viernes", satSun: "Sábado - Domingo", closed: "Cerrado", midi: "Mediodía", soir: "Noche" }
  }[lang as "fr" | "en" | "es"] || { mon: "Lundi", tueFri: "Mardi - Vendredi", satSun: "Samedi - Dimanche", closed: "Fermé", midi: "Midi", soir: "Soir" };

  // Liens Réseaux Sociaux (À adapter avec tes vrais profils)
  const socialLinks = [
    { icon: <Instagram size={18} />, href: "https://www.instagram.com/kabuki_geneve/", label: "Instagram" },
    { icon: <Facebook size={18} />, href: "https://facebook.com/kabukisushigeneve", label: "Facebook" },
    { icon: <Globe size={18} />, href: "https://www.tripadvisor.ch/", label: "TripAdvisor" }, // Optionnel mais recommandé
  ];

  return (
    <footer className="bg-kabuki-black text-white border-t border-neutral-800 pt-16 pb-8">
      <div className="container mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* COLONNE 1 : LOGO & RÉSEAUX */}
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
            {/* ✅ AJOUT DES RÉSEAUX SOCIAUX */}
            <div className="flex space-x-4 pt-2">
              {socialLinks.map((social) => (
                <a 
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-gray-400 hover:bg-kabuki-red hover:text-white transition-all duration-300"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
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
              <li className="flex items-start group">
                <MapPin size={18} className="text-kabuki-red mr-3 shrink-0" />
                <a 
                  href="https://maps.google.com/?q=Kabuki+Sushi+1+Boulevard+de+la+Tour+1205+Genève" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition leading-snug"
                >
                  1 Boulevard de la Tour,<br/>1205 Genève, Suisse
                </a>
              </li>
              <li className="flex items-center group">
                <Phone size={18} className="text-kabuki-red mr-3 shrink-0" />
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
            <ul className="space-y-4 text-gray-400 text-[10px] uppercase tracking-widest">
              <li className="flex flex-col gap-1">
                <span className="text-white font-bold">{days.tueFri}</span>
                <div className="flex justify-between">
                  <span>{days.midi}</span>
                  <span className="text-white">11:20 - 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span>{days.soir}</span>
                  <span className="text-white">18:00 - 22:30</span>
                </div>
              </li>

              <li className="flex flex-col gap-1 border-t border-neutral-800 pt-3">
                <span className="text-white font-bold">{days.satSun}</span>
                <div className="flex justify-between">
                  <span>{days.soir}</span>
                  <span className="text-white">18:00 - 22:30</span>
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