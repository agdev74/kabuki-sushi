import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // ✅ script-src : Garde 'unsafe-eval' (requis par certains outils) et autorise les domaines d'auth
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.supabase.co https://accounts.google.com https://*.gstatic.com",
              // ✅ connect-src : Ajout de https://r.stripe.com pour corriger les erreurs de fetch Stripe
              "connect-src 'self' https://api.stripe.com https://r.stripe.com https://*.supabase.co https://api.resend.com https://*.sentry.io https://accounts.google.com",
              "frame-src 'self' https://js.stripe.com https://accounts.google.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.gstatic.com https://lh3.googleusercontent.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "object-src 'none'",
              "base-uri 'self'",
              // ✅ form-action : Ajout de l'URL spécifique Supabase pour éviter le blocage du "Bounce Tracking" lors de la redirection Google
              "form-action 'self' https://accounts.google.com https://uzgrbehwvuvbukwmufzm.supabase.co",
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=(self)',
              'payment=(self "https://js.stripe.com")',
            ].join(', ')
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', // ✅ Requis pour que la fenêtre Google communique avec ton site
          },
        ],
      },
      {
        source: '/api/webhook',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache' },
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
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    minimumCacheTTL: 3600,
  },

  compress: true,

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ['error'] } : false,
  },
};

export default withSentryConfig(nextConfig, {
  org: "valkha", 
  project: "kabuki-sushi",
  silent: !process.env.CI, 
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});