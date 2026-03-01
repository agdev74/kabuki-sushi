import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ CONFIGURATION DES HEADERS DE SÉCURITÉ (Débloque Stripe & Supabase)
  async headers() {
    return [
      {
        source: '/(:path*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            // unsafe-eval est requis pour Next.js (Framer Motion / Turbopack)
            // connect-src permet de communiquer avec les APIs de Stripe et Supabase
            // frame-src est requis pour l'iFrame sécurisée de paiement Stripe
            value: "default-src 'self'; " +
                   "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://*.supabase.co; " +
                   "connect-src 'self' https://api.stripe.com https://*.supabase.co; " +
                   "frame-src 'self' https://js.stripe.com; " +
                   "img-src 'self' data: https://*.supabase.co; " +
                   "style-src 'self' 'unsafe-inline'; " +
                   "object-src 'none';"
          },
        ],
      },
    ]
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    minimumCacheTTL: 3600, 
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  
  compress: true,

  experimental: {
    // Optimisation pour charger uniquement les icônes utilisées
    optimizePackageImports: ['lucide-react'], 
  },

  compiler: {
    // Nettoyage des logs pour la performance en production
    removeConsole: process.env.NODE_ENV === "production",
  },

  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;