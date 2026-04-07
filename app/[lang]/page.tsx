import { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

// ✅ Ici on utilise params pour le SEO, donc on le garde
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'fr';
  
  if (lang === 'en') {
    return { title: 'Home - Premium Sushi | Kabuki Sushi Geneva' };
  } else if (lang === 'es') {
    return { title: 'Inicio - Sushi Premium | Kabuki Sushi Ginebra' };
  }
  
  return { title: 'Accueil - Restaurant & Traiteur | Kabuki Sushi Genève' };
}

// ✅ Ici on retire 'params' car le composant n'en a pas besoin pour s'afficher
export default function HomePage() {
  return <HomeClient />;
}