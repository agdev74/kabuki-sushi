import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/Navbar"; 
import Footer from "@/components/Footer"; 
import ScrollToTop from "@/components/ScrollToTop";
import PageLoader from "@/components/PageLoader";
import { LanguageProvider } from "@/context/LanguageContext";
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

export const metadata: Metadata = {
  title: {
    template: '%s | Kabuki Sushi',
    default: 'Kabuki Sushi - Restaurant & Traiteur Japonais à Genève',
  },
  description: "L'excellence du sushi à Genève (Plainpalais). Restaurant japonais, vente à emporter et service traiteur. 1 Boulevard de la Tour.",
  keywords: ["Sushi", "Genève", "Traiteur", "Japonais", "Restaurant", "Maki", "Livraison", "Suisse", "Plainpalais"],
  // ✅ AJOUT DU LOGO DANS L'ONGLET DU NAVIGATEUR
  icons: {
    icon: "images/logo.png",
    shortcut: "images/logo.png",
    apple: "images/logo.png",
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
          <PageLoader /> 

          <Navbar />

          <main className="flex-1">
            {children}
          </main>
          
          <ScrollToTop /> 

          <MobileActionBar />

          <CookieBanner/>

          <Footer /> 

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Restaurant",
                "name": "Kabuki Sushi Genève",
                "image": "https://kabuki-sushi.ch/images/logo.png",
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
                "servesCuisine": "Japanese, Sushi, Asian Food",
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
        </LanguageProvider>
      </body>
    </html>
  );
}