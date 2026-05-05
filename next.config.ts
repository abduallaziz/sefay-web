import { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// حط بدله
const nextConfig: NextConfig = {
  // حط بدله
experimental: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hlarjiahlbnxvabomkvu.supabase.co',
      },
    ],
  },
}

export default withNextIntl(nextConfig)