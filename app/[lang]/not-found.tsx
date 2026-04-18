import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="bg-kabuki-black min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      
      {/* Fond décoratif subtil */}
      <div className="absolute inset-0 bg-[url('/pattern-kimono.png')] opacity-5 z-0"></div>
      
      <div className="relative z-10 max-w-2xl mx-auto">
        
        {/* --- EMPLACEMENT IMAGE MIGNONNE --- */}
       
        <div className="relative w-64 h-64 mx-auto mb-8 animate-bounce-slow">
          <Image 
            src="/images/404-sad.png" 
            alt="Petit personnage triste"
            fill
            className="object-contain"
            priority
          />
        </div>
        {/* ------------------------------------------- */}

        {/* Textes plus doux */}
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
          Oh mince, on s&apos;est perdu...
        </h1>
        
        <p className="text-gray-400 text-lg mb-10 leading-relaxed">
          Même notre petit chef ne retrouve pas la page que vous cherchez. <br className="hidden md:block"/>
          Elle a peut-être été mangée par erreur ?
        </p>

        {/* Bouton de retour */}
        <Link 
          href="/" 
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-kabuki-red px-10 py-4 font-bold text-white transition-all hover:scale-105 shadow-xl hover:shadow-red-900/40"
        >
          <span className="absolute inset-0 bg-linear-to-r from-red-600 to-red-800 opacity-0 transition-opacity group-hover:opacity-100"></span>
          <span className="relative tracking-widest uppercase text-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
            </svg>
            Retourner en lieu sûr
          </span>
        </Link>
      </div>

    </div>
  );
}