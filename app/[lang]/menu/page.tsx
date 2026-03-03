import { Metadata } from "next";
import MenuClient from "./MenuClient";
import { supabase } from "@/utils/supabase";

// ✅ OPTIMISATION PERF : Mise en cache du menu côté serveur pendant 1 heure (3600 secondes)
// Cela signifie que le temps de réponse de ta base de données sera de 0ms pour la majorité de tes visiteurs.
export const revalidate = 3600;

type Props = {
  params: Promise<{ lang: string }>;
};

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

// ✅ OPTIMISATION LCP : On transforme le composant en "async" pour charger les données avant l'affichage
export default async function MenuPage() {
  const { data } = await supabase
    .from("menu_items")
    .select("id, name_fr, name_en, name_es, description_fr, description_en, description_es, price, image_url, category, is_available") 
    .eq("is_available", true)
    .order("id", { ascending: true });

  // ✅ CORRECTION TS : On formate les données pour inclure la propriété "name" requise par le CartContext
  const formattedData = (data || []).map((item) => ({
    ...item,
    name: item.name_fr // Fallback obligatoire pour le type ContextMenuItem
  }));

  // On passe les données formatées directement au composant client
  return <MenuClient initialItems={formattedData} />;
}