import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "../globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import LayoutClient from "@/components/LayoutClient"; 
import ActiveOrderButton from "@/components/ActiveOrderButton"; // ✅ 1. Ajout de l'import du bouton

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap', 
});

const oswald = Oswald({ 
  subsets: ["latin"], 
  variable: "--font-oswald",
  display: 'swap',
  weight: ['400', '700'], 
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kabuki-sushi.ch'),
  title: {
    template: '%s | Kabuki Sushi Genève',
    default: 'Kabuki Sushi | Restaurant & Traiteur Japonais de Prestige à Genève',
  },
  description: "L'excellence du sushi à Genève (Plainpalais). Savourez nos créations signatures sur place, à emporter ou via notre service traiteur d'exception.",
  keywords: ["Sushi Genève", "Traiteur Japonais Genève", "Restaurant Japonais Plainpalais", "Livraison Sushi Genève"],
  authors: [{ name: "Kabuki Sushi" }],
  openGraph: {
    type: "website",
    locale: "fr_CH",
    url: "https://kabuki-sushi.ch",
    title: "Kabuki Sushi | L'Art du Sushi à Genève",
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630 }],
  },
  icons: { icon: "/images/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${oswald.variable}`}>
      <body className="antialiased flex flex-col min-h-screen bg-transparent">
        <LanguageProvider>
          <CartProvider>
            {/* ✅ On utilise le LayoutClient pour gérer l'état interactif (Panier, Navbar, etc.) */}
            <LayoutClient>
              {children}
            </LayoutClient>

            {/* ✅ 2. Ajout du bouton flottant ici, accessible sur tout le site */}
            <ActiveOrderButton />

            {/* DONNÉES STRUCTURÉES GOOGLE */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Restaurant",
                  "name": "Kabuki Sushi Genève",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "1 Boulevard de la Tour",
                    "addressLocality": "Genève",
                    "postalCode": "1205",
                    "addressCountry": "CH"
                  },
                  "telephone": "+41786041542",
                  "priceRange": "$$",
                  "servesCuisine": "Japanese, Sushi"
                })
              }}
            />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}