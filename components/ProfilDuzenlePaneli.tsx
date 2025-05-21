'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image';

type Props = {
    acik: boolean
    kapat: () => void
    mevcutAd: string
    mevcutKullaniciAdi: string
    mevcutAvatar: string
}

export default function ProfilDuzenlePaneli({
    acik,
    kapat,
    mevcutAd,
    mevcutKullaniciAdi,
    mevcutAvatar,
}: Props) {
    const [ad, setAd] = useState('')
    const [soyad, setSoyad] = useState('')
    const [kullaniciAdi, setKullaniciAdi] = useState(mevcutKullaniciAdi)
    const [avatar, setAvatar] = useState(mevcutAvatar)
    const [avatarListesi, setAvatarListesi] = useState<string[]>([])
    const [kAdiUyari, setKAdiUyari] = useState<string | null>(null)

    // Mevcut ad soyad ayırma
    useEffect(() => {
        const [isim, ...kalan] = mevcutAd.split(' ')
        setAd(isim || '')
        setSoyad(kalan.join(' ') || '')
    }, [mevcutAd])

    // Avatar listesini Supabase Storage’dan çek
    useEffect(() => {
        async function avatarlariGetir() {
            const { data, error } = await supabase.storage
                .from('avatars')
                .list('', { limit: 100 })

            if (error) {
                console.error('Avatar listesi alınamadı:', error)
                return
            }

            if (data) {
                // Her dosya için public url oluştur
                const urls = data.map((file) =>
                    supabase.storage.from('avatars').getPublicUrl(file.name).data.publicUrl
                )
                setAvatarListesi(urls)
            }
        }

        avatarlariGetir()
    }, [])

    // Kullanıcı adı benzersiz mi kontrol et
    async function kontrolEtKullaniciAdi() {
        if (!kullaniciAdi) {
            setKAdiUyari('Kullanıcı adı boş olamaz.')
            return
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', kullaniciAdi)
            .single()

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = kayıt bulunamadı, o yüzden hata sayma
            console.error(error)
            setKAdiUyari('Kullanıcı adı kontrol edilirken hata oluştu.')
            return
        }

        if (data && data.id !== user?.id) {
            setKAdiUyari('Bu kullanıcı adı zaten alınmış.')
        } else {
            setKAdiUyari(null)
        }
    }

    // Kaydetme fonksiyonu
    async function kaydet() {
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        if (kAdiUyari) return

        const { error } = await supabase
            .from('profiles')
            .update({
                name: ad,
                surname: soyad,
                username: kullaniciAdi,
                avatar: avatar,
            })
            .eq('id', user.id)

        if (error) {
            alert('Profil güncellenemedi. Lütfen tekrar deneyin.')
            console.error(error)
        } else {
            kapat()
        }
    }

    if (!acik) return null

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50">
            <div className="exam-card rounded-xl p-6 w-[90%] max-w-md shadow-lg relative animate-fade-in">
                <button
                    onClick={kapat}
                    className="absolute top-3 right-4 text-gray-500 text-xl font-bold hover:text-red-500"
                    aria-label="Kapat"
                >
                    X
                </button>

                <h2 className="text-xl font-semibold mb-4 text-center">Profili Düzenle</h2>

                <h3 className="text-center font-semibold mb-2">Avatar</h3>

                <div className="flex flex-wrap justify-center gap-3 mb-4 max-h-[150px] overflow-y-auto">
                    {avatarListesi.length === 0 && (
                        <p className="text-gray-500">Avatarlar yükleniyor...</p>
                    )}
                    {avatarListesi.map((url, i) => (
                        <Image
                            key={i}
                            src={url}
                            alt={`avatar-${i}`}
                            onClick={() => setAvatar(url)}
                            className={`w-16 h-16 rounded-full cursor-pointer border-4 transition-colors duration-200 ${avatar === url ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                                }`}
                        />
                    ))}
                </div>

                <div className="flex gap-2 mb-3">
                    <div className="w-1/2">
                        <label className="text-sm text-gray-500" htmlFor="inputAd">
                            Adı
                        </label>
                        <input
                            id="inputAd"
                            type="text"
                            value={ad}
                            onChange={(e) => setAd(e.target.value)}
                            className="exam-card2 w-full rounded p-2 mt-1"
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="text-sm text-gray-500" htmlFor="inputSoyad">
                            Soyadı
                        </label>
                        <input
                            id="inputSoyad"
                            type="text"
                            value={soyad}
                            onChange={(e) => setSoyad(e.target.value)}
                            className="exam-card2 w-full rounded p-2 mt-1"
                        />
                    </div>
                </div>

                <div className="mb-4 text-left">
                    <label className="text-sm text-gray-500" htmlFor="inputKullaniciAdi">
                        Kullanıcı Adı
                    </label>
                    <input
                        id="inputKullaniciAdi"
                        type="text"
                        value={kullaniciAdi}
                        onChange={(e) => setKullaniciAdi(e.target.value)}
                        onBlur={kontrolEtKullaniciAdi}
                        className="exam-card2 w-full rounded p-2 mt-1"
                    />
                    {kAdiUyari && <p className="text-red-500 text-sm mt-1">{kAdiUyari}</p>}
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={kapat}
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                    >
                        İptal
                    </button>
                    <button
                        onClick={kaydet}
                        disabled={!!kAdiUyari}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                    >
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    )
}
