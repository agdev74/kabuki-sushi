import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https://*.supabase.co",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.supabase.co https://accounts.google.com https://*.gstatic.com",
              "connect-src 'self' https://*.stripe.com https://*.supabase.co https://*.sentry.io https://accounts.google.com",
              "frame-src 'self' https://js.stripe.com https://accounts.google.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.gstatic.com https://lh3.googleusercontent.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
            ].join('; ')
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ],
      }
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }
    ],
  }
};

export default withSentryConfig(nextConfig, { silent: true });