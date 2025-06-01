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
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'ucatuzhvtvmnbsnuqfaj.supabase.co',
                pathname: '/storage/v1/object/public/avatars/**',
            },
        ],
    },
    // Netlify için gerekli eklenti
    experimental: {
        esmExternals: 'loose'
    }
}

export default nextConfig