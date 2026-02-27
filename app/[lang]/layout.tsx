import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/Navbar"; 
import Footer from "@/components/Footer"; 
import ScrollToTop from "@/components/ScrollToTop";
import PageLoader from "@/components/PageLoader";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext"; // ✅ Ajout du CartProvider
import MobileActionBar from "@/components/MobileActionBar";
import CookieBanner from "@/components/CookieBanner";

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

// ✅ METADATA OPTIMISÉES POUR LE RÉFÉRENCEMENT GENEVOIS
export const metadata: Metadata = {
  metadataBase: new URL('https://kabuki-sushi.ch'),
  title: {
    template: '%s | Kabuki Sushi Genève',
    default: 'Kabuki Sushi | Restaurant & Traiteur Japonais de Prestige à Genève',
  },
  description: "L'excellence du sushi à Genève (Plainpalais). Savourez nos créations signatures sur place, à emporter ou via notre service traiteur d'exception pour vos événements privés et professionnels.",
  keywords: [
    "Sushi Genève", "Traiteur Japonais Genève", "Restaurant Japonais Plainpalais", 
    "Livraison Sushi Genève", "Plateau Sushi Prestige", "Kabuki Sushi", 
    "Sushi à emporter Genève", "Catering Japonais Suisse"
  ],
  authors: [{ name: "Kabuki Sushi" }],
  creator: "Kabuki Sushi",
  openGraph: {
    type: "website",
    locale: "fr_CH",
    url: "https://kabuki-sushi.ch",
    title: "Kabuki Sushi | L'Art du Sushi à Genève",
    description: "Restaurant & Traiteur Japonais de Prestige. 1 Boulevard de la Tour, Genève.",
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630, alt: "Kabuki Sushi Genève" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kabuki Sushi Genève",
    description: "Restaurant & Traiteur Japonais de Prestige.",
    images: ["/images/og-image.jpg"],
  },
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
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
          {/* ✅ On englobe le tout avec le CartProvider */}
          <CartProvider>
            <PageLoader /> 

            <Navbar />

            <main className="flex-1">
              {children}
            </main>
            
            <ScrollToTop /> 

            <MobileActionBar />

            <CookieBanner/>

            <Footer /> 

            {/* ✅ DONNÉES STRUCTURÉES ENRICHIES (GOOGLE) */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Restaurant",
                  "name": "Kabuki Sushi Genève",
                  "image": "https://kabuki-sushi.ch/images/logo.png",
                  "description": "Restaurant japonais de prestige et service traiteur haut de gamme à Genève.",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "1 Boulevard de la Tour",
                    "addressLocality": "Genève",
                    "postalCode": "1205",
                    "addressCountry": "CH"
                  },
                  "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 46.196,
                    "longitude": 6.143
                  },
                  "url": "https://kabuki-sushi.ch",
                  "telephone": "+41786041542",
                  "priceRange": "$$",
                  "servesCuisine": "Japanese, Sushi, Gourmet",
                  "hasMenu": "https://kabuki-sushi.ch/fr/menu",
                  "acceptsReservations": "true",
                  "areaServed": "Genève",
                  "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "Services",
                    "itemListElement": [
                      {
                        "@type": "Offer",
                        "itemOffered": {
                          "@type": "Service",
                          "name": "Service Traiteur Événementiel"
                        }
                      },
                      {
                        "@type": "Offer",
                        "itemOffered": {
                          "@type": "Service",
                          "name": "Vente à emporter et Livraison"
                        }
                      }
                    ]
                  },
                  "openingHoursSpecification": [
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday"],
                      "opens": "11:20",
                      "closes": "14:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday"],
                      "opens": "18:00",
                      "closes": "22:30"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Saturday", "Sunday"],
                      "opens": "18:00",
                      "closes": "22:30"
                    }
                  ]
                })
              }}
            />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}