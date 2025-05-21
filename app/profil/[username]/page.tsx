import ClientProfilePage from './ClientProfilePage'

interface ProfilePageProps {
    params: { username: string }
}

export default function Page({ params }: ProfilePageProps) {
    return <ClientProfilePage username={params.username} />
}
