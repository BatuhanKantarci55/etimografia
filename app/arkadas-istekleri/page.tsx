'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Istek {
    id: string
    username: string
    name: string | null
    surname: string | null
    avatar: string | null
}

export default function ArkadasIstekleri() {
    const [istekler, setIstekler] = useState<Istek[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        async function fetchIstekler() {
            setLoading(true)

            // Giriş yapan kullanıcıyı al
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) return

            setUserId(user.id)

            // Kendisine gelen pending arkadaşlık isteklerini al
            const { data, error } = await supabase
                .from('friendships')
                .select('user_id')
                .eq('friend_id', user.id)
                .eq('status', 'pending')

            if (error || !data) {
                setLoading(false)
                return
            }

            const gonderenIDs = data.map(i => i.user_id)

            // Kullanıcı bilgilerini al
            const { data: profiller } = await supabase
                .from('profiles')
                .select('id, username, name, surname, avatar')
                .in('id', gonderenIDs)

            if (profiller) setIstekler(profiller)
            setLoading(false)
        }

        fetchIstekler()
    }, [])

    const kabulEt = async (gonderenId: string) => {
        if (!userId) return

        await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('user_id', gonderenId)
            .eq('friend_id', userId)

        // Listeyi güncelle
        setIstekler(prev => prev.filter(i => i.id !== gonderenId))
    }

    const reddet = async (gonderenId: string) => {
        if (!userId) return

        await supabase
            .from('friendships')
            .delete()
            .eq('user_id', gonderenId)
            .eq('friend_id', userId)

        // Listeyi güncelle
        setIstekler(prev => prev.filter(i => i.id !== gonderenId))
    }

    if (loading) return <div className="text-center mt-10">Yükleniyor...</div>

    return (
        <div className="max-w-lg mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-center">Gelen Arkadaşlık İstekleri</h1>

            {istekler.length === 0 ? (
                <p className="text-center text-gray-500">Hiç arkadaşlık isteğiniz yok.</p>
            ) : (
                <ul className="space-y-4">
                    {istekler.map((kisi) => (
                        <li key={kisi.id} className="flex items-center justify-between p-3 bg-white/10 dark:bg-black/20 border-b border-white/10 rounded-lg">
                            <Link href={`/profil/${kisi.username}`} className="flex items-center gap-3">
                                <img
                                    src={kisi.avatar || '/avatar.png'}
                                    alt="avatar"
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                    <p className="font-medium">{kisi.name} {kisi.surname}</p>
                                    <p className="text-sm text-gray-500">@{kisi.username}</p>
                                </div>
                            </Link>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => kabulEt(kisi.id)}
                                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                                >
                                    Kabul Et
                                </button>
                                <button
                                    onClick={() => reddet(kisi.id)}
                                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                                >
                                    Reddet
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
