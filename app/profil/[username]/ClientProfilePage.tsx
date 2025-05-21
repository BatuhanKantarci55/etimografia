'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image';

function zamanFarkiMetni(lastActiveStr: string | null) {
    if (!lastActiveStr) return 'Aktiflik bilgisi yok';

    const lastActive = new Date(lastActiveStr);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) return 'Şu anda çevrimiçi';
    if (diffMinutes < 60) return `${diffMinutes} dakika önce aktifti`;
    if (diffHours < 24) return `${diffHours} saat önce aktifti`;

    return `Son aktiflik: ${lastActive.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })}`;
}

export default function ClientProfilePage({ username }: { username: string }) {
    const [profile, setProfile] = useState<{
        name: string | null
        surname: string | null
        username: string
        avatar: string | null
        created_at: string
        total_score: number | null
        id: string
        last_active: string | null
    } | null>(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [girisYapanID, setGirisYapanID] = useState<string | null>(null)
    const [hedefID, setHedefID] = useState<string | null>(null)
    const [arkadaslikDurumu, setArkadaslikDurumu] = useState<'arkadas' | 'bekliyor' | 'yok'>('yok')

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            setError(null)

            const { data: prof, error: profError } = await supabase
                .from('profiles')
                .select('id, name, surname, username, avatar, created_at, total_score, last_active')
                .eq('username', username)
                .single()

            if (profError || !prof) {
                setError('Kullanıcı bulunamadı.')
                setLoading(false)
                return
            }

            setProfile(prof)
            setHedefID(prof.id)

            const {
                data: { user }
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
            status: 'pending'
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

    if (loading)
        return <div className="text-center mt-10 text-gray-600">Yükleniyor...</div>

    if (error)
        return <div className="text-center mt-10 text-red-600 font-semibold">{error}</div>

    if (!profile) return null

    const tamAd = `${profile.name ?? ''} ${profile.surname ?? ''}`.trim()
    const katilmaTarihi = new Date(profile.created_at).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long'
    })
    const aktiflikDurumu = zamanFarkiMetni(profile.last_active)
    const aktiflikRenk = aktiflikDurumu === 'Şu anda çevrimiçi' ? 'text-green-600' : 'text-gray-500'

    return (
        <div className="max-w-lg mx-auto p-4 text-center">
            <div className="flex flex-col items-center gap-2 mb-6">
                <Image
                    src={profile.avatar || '/avatar.png'}
                    alt="avatar"
                    className="w-32 h-32 rounded-full object-cover shadow-md"
                />
                <h1 className="text-lg font-bold">{tamAd || `@${profile.username}`}</h1>
                <p className="text-gray-600">@{profile.username}</p>
                <p className="text-sm text-gray-400">{katilmaTarihi} tarihinde katıldı</p>
                <p className={`text-sm italic ${aktiflikRenk}`}>{aktiflikDurumu}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 text-center mb-6">
                <div className="exam-card p-4 rounded-xl shadow">
                    <p className="text-xs text-gray-500">Toplam Puan</p>
                    <p className="text-lg font-bold">{profile.total_score ?? 0}</p>
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
