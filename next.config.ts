// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true, // ✅ Vercel build sırasında lint hatalarını yok sayacak
    },
    experimental: {
        appDir: true,
    },
};

module.exports = nextConfig;
