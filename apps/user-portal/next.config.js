/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Disable telemetry for on-premise deployment
  experimental: {
    instrumentationHook: false,
  },

  // Security headers (On-Premise Compliance)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Disable external image domains for security (On-Premise only)
  images: {
    unoptimized: false,
    remotePatterns: [],
  },

  // Output standalone for Docker deployment
  output: 'standalone',
};

module.exports = nextConfig;
