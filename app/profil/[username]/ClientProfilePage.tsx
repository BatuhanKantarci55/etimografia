'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import Link from 'next/link'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'

type Profile = {
    id: string
    name: string | null
    surname: string | null
    username: string
    avatar: string | null
    created_at: string
    total_score: number | null
    highest_score: number | null
    last_active: string | null
    biography?: string | null
}

type Friend = {
    username: string
    avatar: string | null
}

function zamanFarkiMetni(lastActiveStr: string | null) {
    if (!lastActiveStr) return 'Aktiflik bilgisi yok'

    const lastActive = new Date(lastActiveStr)
    const now = new Date()
    const diffMs = now.getTime() - lastActive.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)

    if (diffSeconds < 60) return 'Şu anda çevrimiçi'
    if (diffMinutes < 60) return `${diffMinutes} dakika önce aktifti`
    if (diffHours < 24) return `${diffHours} saat önce aktifti`

    return `Son aktiflik: ${lastActive.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })}`
}

export default function ClientProfilePage({ username }: { username: string }) {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [girisYapanID, setGirisYapanID] = useState<string | null>(null)
    const [hedefID, setHedefID] = useState<string | null>(null)
    const [arkadaslikDurumu, setArkadaslikDurumu] = useState<'arkadas' | 'bekliyor' | 'yok'>('yok')
    const [leaderboardSirrasi, setLeaderboardSirrasi] = useState<number | null>(null)
    const [enYuksekSira, setEnYuksekSira] = useState<number | null>(null)
    const [arkadaslar, setArkadaslar] = useState<Friend[]>([])
    const [arkadaslarAcik, setArkadaslarAcik] = useState(false)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            setError(null)

            const { data: prof, error: profError } = await supabase
                .from('profiles')
                .select('id, name, surname, username, avatar, created_at, total_score, highest_score, last_active, biography')
                .eq('username', username)
                .single()

            if (profError || !prof) {
                setError('Kullanıcı bulunamadı.')
                setLoading(false)
                return
            }

            setProfile(prof)
            setHedefID(prof.id)

            // Arkadaşları getir
            const fetchFriends = async (userId: string) => {
                const { data: friendships } = await supabase
                    .from('friendships')
                    .select('user_id, friend_id')
                    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
                    .eq('status', 'accepted')

                const arkadasIdler = friendships
                    ? friendships
                        .map((f) => (f.user_id === userId ? f.friend_id : f.user_id))
                        .filter((id) => id !== userId)
                    : []

                if (arkadasIdler.length > 0) {
                    const { data: friendsProfiles } = await supabase
                        .from('profiles')
                        .select('username, avatar')
                        .in('id', arkadasIdler)

                    setArkadaslar(friendsProfiles?.map(p => ({
                        username: p.username,
                        avatar: p.avatar
                    })) ?? [])
                }
            }

            fetchFriends(prof.id)

            // Toplam puan sırası
            const { data: leaderboard } = await supabase
                .from('profiles')
                .select('id')
                .order('total_score', { ascending: false })

            const sira = leaderboard?.findIndex(p => p.id === prof.id)
            if (sira !== undefined && sira !== -1) {
                setLeaderboardSirrasi(sira + 1)
            }

            // Highest score sırası
            const { data: leaderboardHighest } = await supabase
                .from('profiles')
                .select('id')
                .order('highest_score', { ascending: false })

            const sira2 = leaderboardHighest?.findIndex(p => p.id === prof.id)
            if (sira2 !== undefined && sira2 !== -1) {
                setEnYuksekSira(sira2 + 1)
            }

            // Giriş yapan kullanıcıyı kontrol et
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                setGirisYapanID(null)
                setLoading(false)
                return
            }

            setGirisYapanID(user.id)

            if (user.id === prof.id) {
                setLoading(false)
                return
            }

            // Arkadaşlık durumu
            const { data: iliski } = await supabase
                .from('friendships')
                .select('*')
                .or(
                    `and(user_id.eq.${user.id},friend_id.eq.${prof.id}),and(user_id.eq.${prof.id},friend_id.eq.${user.id})`
                )
                .maybeSingle()

            if (iliski) {
                if (iliski.status === 'accepted') {
                    setArkadaslikDurumu('arkadas')
                } else if (iliski.status === 'pending' && iliski.user_id === user.id) {
                    setArkadaslikDurumu('bekliyor')
                }
            } else {
                setArkadaslikDurumu('yok')
            }

            setLoading(false)
        }

        fetchData()
    }, [username])

    async function istegiGonder() {
        if (!girisYapanID || !hedefID) return
        const { error } = await supabase.from('friendships').insert({
            user_id: girisYapanID,
            friend_id: hedefID,
            status: 'pending',
        })
        if (!error) setArkadaslikDurumu('bekliyor')
    }

    async function arkadasligiBitir() {
        if (!girisYapanID || !hedefID) return
        const { error } = await supabase
            .from('friendships')
            .delete()
            .or(
                `and(user_id.eq.${girisYapanID},friend_id.eq.${hedefID}),and(user_id.eq.${hedefID},friend_id.eq.${girisYapanID})`
            )
        if (!error) {
            setArkadaslikDurumu('yok')
        }
    }

    if (loading) return <div className="text-center mt-10 text-gray-600">Yükleniyor...</div>
    if (error) return <div className="text-center mt-10 text-red-600 font-semibold">{error}</div>
    if (!profile) return null

    const tamAd = `${profile.name ?? ''} ${profile.surname ?? ''}`.trim()
    const katilmaTarihi = new Date(profile.created_at).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
    })
    const aktiflikDurumu = zamanFarkiMetni(profile.last_active)
    const aktiflikRenk = aktiflikDurumu === 'Şu anda çevrimiçi' ? 'text-green-600' : 'text-gray-500'

    return (
        <div className="max-w-lg mx-auto p-4 text-center">
            <div className="flex flex-col items-center gap-2 mb-6">
                <Image
                    src={profile.avatar || '/avatar.png'}
                    alt="avatar"
                    width={64}
                    height={64}
                    className="w-32 h-32 rounded-full object-cover shadow-md"
                />
                <h1 className="text-lg font-bold">{tamAd || `@${profile.username}`}</h1>
                <p className="text-gray-600">@{profile.username}</p>
                <p className="text-sm text-gray-400">{katilmaTarihi} tarihinde katıldı</p>
                <p className={`text-sm italic ${aktiflikRenk}`}>{aktiflikDurumu}</p>

                {profile.biography && (
                    <div className="exam-card p-4 rounded-xl shadow w-full text-left mt-2">
                        <p className="text-base italic whitespace-pre-line">{profile.biography}</p>
                    </div>
                )}
            </div>

            {/* Arkadaşlar Bölümü */}
            <div className="exam-card rounded-xl shadow p-3 mb-4">
                <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setArkadaslarAcik(!arkadaslarAcik)}
                >
                    <p className="text-base">Arkadaşlar ({arkadaslar.length})</p>
                    {arkadaslarAcik ? <FiChevronUp /> : <FiChevronDown />}
                </div>
                {arkadaslarAcik && (
                    <ul className="mt-2 text-left text-sm max-h-48 overflow-y-auto">
                        {arkadaslar.map((arkadas) => (
                            <li key={arkadas.username} className="py-1 flex items-center gap-2">
                                <Link href={`/profil/${arkadas.username}`}>
                                    <div className="flex items-center gap-2 hover:scale-105 transition-transform p-1 rounded-md">
                                        <Image
                                            src={arkadas.avatar || '/avatar.png'}
                                            alt={`${arkadas.username} avatar`}
                                            width={64}
                                            height={64}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <span className='text-base'>@{arkadas.username}</span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-center mb-6">
                <div className="exam-card p-4 rounded-xl shadow">
                    <p className="text-xs text-gray-500">Toplam Puan</p>
                    <p className="text-lg font-bold">{profile.total_score ?? 0}</p>
                </div>
                <div className="exam-card p-4 rounded-xl shadow">
                    <p className="text-xs text-gray-500">Sıralama</p>
                    <p className="text-lg font-bold">#{leaderboardSirrasi ?? '-'}</p>
                </div>
                <div className="exam-card p-4 rounded-xl shadow">
                    <p className="text-xs text-gray-500">En Yüksek Puan</p>
                    <p className="text-lg font-bold">{profile.highest_score ?? 0}</p>
                </div>
                <div className="exam-card p-4 rounded-xl shadow">
                    <p className="text-xs text-gray-500">En Yüksek Puan Sırası</p>
                    <p className="text-lg font-bold">#{enYuksekSira ?? '-'}</p>
                </div>
            </div>

            {girisYapanID && hedefID && girisYapanID !== hedefID && (
                <div className="mt-4">
                    {arkadaslikDurumu === 'arkadas' && (
                        <>
                            <p className="text-green-600 font-semibold">✅ Arkadaşsınız</p>
                            <button
                                onClick={arkadasligiBitir}
                                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                            >
                                ❌ Arkadaşlığı Bitir
                            </button>
                        </>
                    )}
                    {arkadaslikDurumu === 'bekliyor' && (
                        <p className="text-yellow-500 font-semibold">⏳ İstek gönderildi</p>
                    )}
                    {arkadaslikDurumu === 'yok' && (
                        <button
                            onClick={istegiGonder}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            ➕ Arkadaşlık isteği gönder
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}