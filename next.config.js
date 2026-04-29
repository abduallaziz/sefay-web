 /** @type {import('next').NextConfig} */
const nextConfig = {
  // تحسين الأداء
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },

  // ضغط الصور
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // تقليل الـ bundle
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Headers للأداء
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
        ],
      },
      {
        source: '/(.*)\\.(css|js|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

module.exports = nextConfig