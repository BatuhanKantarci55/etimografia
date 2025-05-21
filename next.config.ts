// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true, // 💥 BU SATIR ÇOK ÖNEMLİ!
    },
    experimental: {
        // Eğer app directory kullanıyorsan bu da iyi olur:
        appDir: true,
    },
    // Diğer ayarlar varsa silme, altına yaz
}

module.exports = nextConfig
