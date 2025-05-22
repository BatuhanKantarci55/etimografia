// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true, // Build sırasında ESLint hatalarını ignore et
    },
    typescript: {
        ignoreBuildErrors: true, // TypeScript hatalarını ignore et (isteğe bağlı)
    },
    images: {
        domains: ['ucatuzhvtvmnbsnuqfaj.supabase.co'],
    },
    // Netlify için gerekli eklenti
    experimental: {
        esmExternals: 'loose'
    }
}

export default nextConfig