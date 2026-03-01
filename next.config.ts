import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

  // ✅ CONFIGURATION TREE-SHAKING & BUNDLE OPTIMIZATION
  experimental: {
    // Force Next.js à ne charger que les icônes Lucide que tu utilises vraiment
    optimizePackageImports: ['lucide-react'], 
  },

  // ✅ SUPPRESSION DES LOGS EN PRODUCTION (Réduit le TBT)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // ✅ OPTIMISATION DU CACHE DE PRODUCTION
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;