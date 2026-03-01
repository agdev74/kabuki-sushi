import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // ✅ Optimisation : Priorité au format AVIF (plus léger que WebP)
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Autorise toutes les instances Supabase
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // ✅ Bonus : Mise en cache agressive pour réduire la charge serveur
    minimumCacheTTL: 3600, 
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Tailles adaptées aux mobiles et desktop
  },
  // ✅ Optionnel : Active la compression gzip/brotli automatique pour le texte (HTML/JS/CSS)
  compress: true,
};

export default nextConfig;