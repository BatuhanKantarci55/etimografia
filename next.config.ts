// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'ucatuzhvtvmnbsnuqfaj.supabase.co',
                pathname: '/storage/v1/object/public/**', // avatars/** yerine daha geniş
            },
        ],
    },
    experimental: {
        esmExternals: 'loose',
    },
}

export default nextConfig
