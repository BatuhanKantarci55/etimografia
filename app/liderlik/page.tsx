'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Medal, UserCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link' // ✅ Link bileşenini ekledik

type Kullanici = {
    id: string
    username: string
    avatar: string
    total_score: number
}

export default function LiderlikSayfasi() {
    const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([])
    const [kendiId, setKendiId] = useState<string | null>(null)

    useEffect(() => {
        const kullaniciBilgisi = async () => {
            const { data: sessionData } = await supabase.auth.getSession()
            setKendiId(sessionData.session?.user?.id || null)
        }

        const verileriGetir = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, avatar, total_score')
                .order('total_score', { ascending: false })
                .limit(20)

            if (error) {
                console.error('Liderlik verileri alınamadı:', error)
                return
            }

            if (data) setKullanicilar(data)
        }

        kullaniciBilgisi()
        verileriGetir()
    }, [])

    const arkaplanlar = ['theme-gold', 'theme-silver', 'theme-bronze']

    return (
        <div className="py-12 px-4">
            <motion.h1
                className="text-4xl font-bold text-center mb-12 text-theme-title"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                🏆 Liderlik Tablosu
            </motion.h1>

            <div className="max-w-4xl mx-auto space-y-6">
                {kullanicilar.map((kullanici, index) => {
                    const isBen = kullanici.id === kendiId
                    const isIlkUc = index < 3

                    const arkaPlan = isIlkUc
                        ? `${arkaplanlar[index]} text-dark`
                        : isBen
                            ? 'bg-theme-self'
                            : 'bg-theme-card'

                    return (
                        <motion.div
                            key={kullanici.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.03 }}
                            className={`flex items-center justify-between p-5 rounded-3xl shadow-xl backdrop-blur-md border border-white/10 ${arkaPlan}`}
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 font-bold text-xl">
                                    {isIlkUc ? <Medal className="w-6 h-6" /> : <span>{index + 1}</span>}
                                </div>

                                {/* ✅ Avatarı tıklanabilir yaptık */}
                                <Link href={`/profil/${kullanici.username}`}>
                                    <div className="relative w-16 h-16 hover:scale-105 transition-transform">
                                        <Image
                                            src={kullanici.avatar}
                                            alt={kullanici.username}
                                            fill
                                            className="rounded-full object-cover"
                                        />
                                    </div>
                                </Link>

                                <div>
                                    <p className="font-semibold text-lg flex items-center gap-2 text-theme-text">
                                        <UserCircle2 className="w-5 h-5" />
                                        {kullanici.username}
                                        {isBen && (
                                            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-white/20 border border-white/30">
                                                Siz
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-base text-theme-subtext">
                                        Toplam Puan: <span className="font-semibold">{kullanici.total_score}</span>
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
