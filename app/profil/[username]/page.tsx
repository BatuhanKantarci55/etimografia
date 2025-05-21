import ClientProfilePage from './ClientProfilePage'

export async function generateStaticParams() {
    // İstersen buraya veritabanından username'leri çekip koyabilirsin.
    // Şimdilik boş dizi döndürüyoruz, böylece build hatası olmaz.
    return []
}

export default async function Page({ params }: { params: { username: string } }) {
    return <ClientProfilePage username={params.username} />
}
