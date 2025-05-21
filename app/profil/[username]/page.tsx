import ClientProfilePage from './ClientProfilePage'

interface ProfilePageProps {
    params: { username: string }
}

export async function generateStaticParams() {
    // Burada kullanıcı adlarını dinamik olarak çekebilirsin
    // Şimdilik boş dizi dönüyoruz ki build hata vermesin
    return []
}

export default async function Page({ params }: ProfilePageProps) {
    return <ClientProfilePage username={params.username} />
}
