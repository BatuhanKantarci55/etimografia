import ClientProfilePage from './ClientProfilePage'

export async function generateStaticParams() {
    return []
}

// Burada dikkat et! params: Promise<{ username: string }>
export default async function Page({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = await params
    return <ClientProfilePage username={resolvedParams.username} />
}
