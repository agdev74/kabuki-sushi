import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // 🛡️ DÉSACTIVATION DU CSP EN DÉVELOPPEMENT POUR ÉVITER LES RECHARGEMENTS INFINIS
    if (process.env.NODE_ENV === 'development') {
      return [];
    }

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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.supabase.co https://accounts.google.com https://*.gstatic.com https://api-js.mixpanel.com",
              "connect-src 'self' https://api.stripe.com https://r.stripe.com https://*.supabase.co https://api.resend.com https://*.sentry.io https://ingest.de.sentry.io https://accounts.google.com https://api-js.mixpanel.com",
              "frame-src 'self' https://js.stripe.com https://accounts.google.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.gstatic.com https://lh3.googleusercontent.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com https://uzgrbehwvuvbukwmufzm.supabase.co",
            ].join('; ')
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=(self)',
              'payment=(self "https://js.stripe.com")',
            ].join(', ')
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
      {
        source: '/api/webhook',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache' }],
      },
    ]
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    minimumCacheTTL: 3600,
  },
  compress: true,
  experimental: { optimizePackageImports: ['lucide-react'] },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ['error'] } : false,
  },
};

export default withSentryConfig(nextConfig, {
  org: "valkha", 
  project: "kabuki-sushi",
  silent: !process.env.CI, 
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});