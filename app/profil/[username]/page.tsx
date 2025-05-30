import ClientProfilePage from './ClientProfilePage'

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params

    return <ClientProfilePage username={username} />
}
