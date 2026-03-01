import { Metadata } from "next";
import MenuClient from "./MenuClient";

// ✅ On s'assure que params est bien une Promise
type Props = {
  params: Promise<{ lang: string }>;
};

// ✅ On ajoute await devant params
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || "fr";
  
  const titles: Record<string, string> = {
    fr: "Notre Carte | 97 Créations Originales",
    en: "Our Menu | 97 Original Sushi Creations",
    es: "Nuestra Carta | 97 Creaciones de Sushi",
  };

  const descriptions: Record<string, string> = {
    fr: "Découvrez nos 97 produits : Nigiris, Makis, Signatures et Box à partager. À emporter ou en livraison.",
    en: "Explore our 97 products: Nigiris, Makis, Signatures, and Boxes to share. Takeaway or delivery.",
    es: "Descubre nuestros 97 productos: Nigiris, Makis, Signatures y Boxes para compartir. Para llevar o a domicilio.",
  };

  return {
    title: titles[lang] || titles.fr,
    description: descriptions[lang] || descriptions.fr,
  };
}

export default function MenuPage() {
  return <MenuClient />;
}