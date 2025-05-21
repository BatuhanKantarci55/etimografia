import ClientProfilePage from './ClientProfilePage'

interface ProfilePageProps {
    params: { username: string }
}

export default async function Page({ params }: ProfilePageProps) {
    return <ClientProfilePage username={params.username} />
}
