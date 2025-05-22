'use client'

import { useState, useEffect } from 'react'
import { FaCog } from 'react-icons/fa'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import ProfilDuzenlePaneli from '@/components/ProfilDuzenlePaneli'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import Link from 'next/link'

export default function ProfilSayfasi() {
    const [siralama, setSiralama] = useState<number | null>(null)
    const [highestScoreRank, setHighestScoreRank] = useState<number | null>(null)
    const [arkadaslarAcik, setArkadaslarAcik] = useState(false)
    const [duzenleAcik, setDuzenleAcik] = useState(false)
    const [kullanici, setKullanici] = useState<{
        ad: string
        kullaniciAdi: string
        katilmaTarihi: string
        avatarUrl: string
        arkadaslar: { username: string; avatar: string }[]
        toplamPuan: number
        siralama: number
        highestScore: number
    } | null>(null)

    useEffect(() => {
        async function fetchUserData() {
            try {
                const {
                    data: { user: currentUser },
                    error: userError,
                } = await supabase.auth.getUser()
                if (userError || !currentUser) return

                const { data: profileData } = await supabase
                    .from('profiles')
                    .select(`
                        name,
                        surname,
                        username,
                        avatar,
                        created_at,
                        total_score,
                        highest_score
                    `)
                    .eq('id', currentUser.id)
                    .single()

                const { data: friendships } = await supabase
                    .from('friendships')
                    .select('user_id, friend_id')
                    .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`)
                    .eq('status', 'accepted')

                const arkadasIdler = friendships
                    ? friendships
                        .map((f) => (f.user_id === currentUser.id ? f.friend_id : f.user_id))
                        .filter((id) => id !== currentUser.id)
                    : []

                let arkadaslar: { username: string; avatar: string }[] = []
                if (arkadasIdler.length > 0) {
                    const { data: friendsProfiles } = await supabase
                        .from('profiles')
                        .select('username, avatar')
                        .in('id', arkadasIdler)

                    arkadaslar = friendsProfiles?.map((p) => ({
                        username: p.username,
                        avatar: p.avatar ?? '/avatar.png',
                    })) ?? []
                }

                setKullanici({
                    ad: `${profileData.name ?? ''} ${profileData.surname ?? ''}`.trim(),
                    kullaniciAdi: profileData.username ?? '',
                    katilmaTarihi: profileData.created_at ?? '',
                    avatarUrl: profileData.avatar ?? '/avatar.png',
                    arkadaslar,
                    toplamPuan: profileData.total_score ?? 0,
                    siralama: 0,
                    highestScore: profileData.highest_score ?? 0,
                })
            } catch (err) {
                console.error('fetchUserData hata:', err)
            }
        }

        fetchUserData()
    }, [])

    useEffect(() => {
        async function siraHesapla() {
            const { data: authUser } = await supabase.auth.getUser()
            if (!authUser.user) return

            const { data: tumKullanicilar } = await supabase
                .from('profiles')
                .select('id, highest_score, total_score')

            if (!tumKullanicilar) return

            // Toplam puan sıralaması
            const totalSorted = [...tumKullanicilar].sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))
            const totalIndex = totalSorted.findIndex((u) => u.id === authUser.user.id)
            setSiralama(totalIndex >= 0 ? totalIndex + 1 : null)

            // En yüksek skor sıralaması
            const highSorted = [...tumKullanicilar].sort((a, b) => (b.highest_score ?? 0) - (a.highest_score ?? 0))
            const highIndex = highSorted.findIndex((u) => u.id === authUser.user.id)
            setHighestScoreRank(highIndex >= 0 ? highIndex + 1 : null)
        }

        siraHesapla()
    }, [])

    const katilmaTarihi = kullanici ? new Date(kullanici.katilmaTarihi) : null
    const tarihYazi = katilmaTarihi
        ? katilmaTarihi.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
        : ''

    if (!kullanici) return <p className='text-center text-xl p-8'>Yükleniyor...</p>

    return (
        <div className="max-w-lg mx-auto p-4 text-center relative">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">Profil</h1>
                <FaCog
                    className="text-gray-600 text-xl cursor-pointer hover:rotate-30 transition"
                    onClick={() => setDuzenleAcik(true)}
                />
            </div>

            {(!kullanici.ad || kullanici.ad.trim() === '' || kullanici.avatarUrl === '/avatar.png') && (
                <div className="eksik-profil mb-4 px-4 py-2 rounded-xl shadow">
                    Profili tamamlayın: Adı, soy adı veya avatarı eksik
                    <button
                        className="ml-2 underline text-blue-600 hover:text-blue-800 transition cursor-pointer"
                        onClick={() => setDuzenleAcik(true)}
                    >
                        Düzenle
                    </button>
                </div>
            )}

            <div className="flex flex-col items-center gap-2 mb-4">
                <Image
                    src={kullanici.avatarUrl}
                    alt="avatar"
                    width={64}
                    height={64}
                    className="w-32 h-32 rounded-full object-cover shadow-md"
                />
                <h2 className="text-lg font-bold">{kullanici.ad}</h2>
                <p>@{kullanici.kullaniciAdi}</p>
                <p className="text-gray-400">{tarihYazi} tarihinde katıldı</p>
            </div>

            <div className="exam-card rounded-xl shadow p-3 mb-4">
                <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setArkadaslarAcik(!arkadaslarAcik)}
                >
                    <p className="text-base">Arkadaşlar ({kullanici.arkadaslar.length})</p>
                    {arkadaslarAcik ? <FiChevronUp /> : <FiChevronDown />}
                </div>
                {arkadaslarAcik && (
                    <ul className="mt-2 text-left text-sm max-h-48 overflow-y-auto">
                        {kullanici.arkadaslar.map((arkadas) => (
                            <li key={arkadas.username} className="py-1 flex items-center gap-2">
                                <Link href={`/profil/${arkadas.username}`}>
                                    <div className="flex items-center gap-2 hover:scale-105 transition-transform p-1 rounded-md">
                                        <Image
                                            src={arkadas.avatar}
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

            {/* Yeni İstatistikler */}
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
                <div className="exam-card p-4 rounded-xl shadow">
                    <p className="text-xs text-gray-500">Toplam Puan</p>
                    <p className="text-lg font-bold">{kullanici.toplamPuan}</p>
                </div>
                <div className="exam-card p-4 rounded-xl shadow">
                    <p className="text-xs text-gray-500">Puan Sıralaması</p>
                    <p className="text-lg font-bold">{siralama ? `${siralama}.` : '-'}</p>
                </div>
                <div className="exam-card p-4 rounded-xl shadow">
                    <p className="text-xs text-gray-500">En Yüksek Skor</p>
                    <p className="text-lg font-bold">{kullanici.highestScore}</p>
                </div>
                <div className="exam-card p-4 rounded-xl shadow">
                    <p className="text-xs text-gray-500">Skor Sıralaması</p>
                    <p className="text-lg font-bold">{highestScoreRank ? `${highestScoreRank}.` : '-'}</p>
                </div>
            </div>

            <div className="exam-card p-4 rounded-xl shadow text-center text-gray-400">
                <p className="text-sm">🎖️ Rozetler özelliği yakında burada!</p>
            </div>

            <ProfilDuzenlePaneli
                acik={duzenleAcik}
                kapat={() => setDuzenleAcik(false)}
                mevcutAd={kullanici.ad}
                mevcutKullaniciAdi={kullanici.kullaniciAdi}
                mevcutAvatar={kullanici.avatarUrl}
            />
        </div>
    )
}
