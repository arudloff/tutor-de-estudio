// Socrates - Next.js config
// Security headers + strict mode + reactStrictMode on

const isDev = process.env.NODE_ENV === 'development'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    // En dev, Next.js necesita 'unsafe-eval' para HMR (hot module replacement)
    // En produccion, CSP es restrictiva (deuda tecnica: migrar a nonces en S6)
    const csp = isDev
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "media-src 'self' blob:",
          "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.openai.com ws://localhost:3000 https://*.google.com https://*.googleapis.com wss://*.google.com",
          "frame-ancestors 'none'",
        ].join('; ')
      : [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "media-src 'self' blob:",
          "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.openai.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

export default nextConfig
