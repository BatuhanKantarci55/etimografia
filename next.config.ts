// next.config.js veya next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // ❌ experimental: { appDir: true } satırını kaldır
}

module.exports = nextConfig

// next.config.js
module.exports = {
    images: {
        domains: ['ucatuzhvtvmnbsnuqfaj.supabase.co'],
    },
};
