'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const FloatingInput = ({
    id,
    type,
    label,
    value,
    onChange,
}: {
    id: string
    type: string
    label: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
    const [focused, setFocused] = useState(false)

    const yukariCik = focused || value.length > 0

    return (
        <div className="relative w-full">
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="peer h-12 w-full rounded-xl px-4 pt-4 pb-1 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition button"
                placeholder={label}
            />
            <label
                htmlFor={id}
                className={`absolute left-4 text-gray-500 transition-all ${yukariCik
                    ? 'top-1 text-sm text-blue-600'
                    : 'top-3.5 text-base text-gray-400'
                    }`}
            >
                {label}
            </label>
        </div>
    )
}


export default function GirisKaydolFormu() {
    const [mod, setMod] = useState<'giris' | 'kaydol'>('giris')
    const [eposta, setEposta] = useState('')
    const [kullaniciAdi, setKullaniciAdi] = useState('')
    const [sifre, setSifre] = useState('')
    const [mesaj, setMesaj] = useState('')
    const [yükleniyor, setYükleniyor] = useState(false)

    const epostaGecerliMi = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const sifreGecerliMi = (s: string) => s.length >= 6

    const kaydol = async () => {
        setYükleniyor(true)
        setMesaj('')

        // Kullanıcı adının benzersizliğini kontrol et
        const { data: varOlanKullanici } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', kullaniciAdi)
            .single()

        if (varOlanKullanici) {
            setMesaj('Bu kullanıcı adı zaten kullanılıyor. Lütfen başka bir tane seçin.')
            setYükleniyor(false)
            return
        }

        // Supabase ile e-posta ve şifreyle kayıt ol
        const { data, error } = await supabase.auth.signUp({
            email: eposta,
            password: sifre,
        })

        if (error) {
            setMesaj(error.message)
            setYükleniyor(false)
            return
        }

        const userId = data.user?.id
        if (userId) {
            const { error: profilHata } = await supabase
                .from('profiles')
                .insert([{ id: userId, username: kullaniciAdi }])

            if (profilHata) {
                if (profilHata.code === '23505') {
                    setMesaj('Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane seçin.')
                } else {
                    setMesaj('Profil oluşturulurken bir hata oluştu: ' + profilHata.message)
                }
                setYükleniyor(false)
                return
            }

            // ✅ Kayıt başarılıysa e-posta doğrulama ekranına yönlendir
            window.location.href = '/dogrulama-bekleniyor'
        }

        setYükleniyor(false)
    }


    const girisYap = async () => {
        setYükleniyor(true)
        setMesaj('')

        const { data, error } = await supabase.auth.signInWithPassword({
            email: eposta,
            password: sifre,
        })

        if (error) {
            setMesaj(error.message)
            setYükleniyor(false)
            return
        }

        if (data.user?.email_confirmed_at === null) {
            setMesaj('E-posta adresiniz henüz doğrulanmadı. Lütfen e-postanıza gönderilen doğrulama bağlantısını tıklayın.')
            setYükleniyor(false)
            return
        }

        // Giriş başarılı ve e-posta doğrulandıysa anasayfaya yönlendir
        window.location.href = '/'
        setYükleniyor(false)
    }


    const gonderimHazir =
        epostaGecerliMi(eposta) &&
        sifreGecerliMi(sifre) &&
        (mod === 'giris' || kullaniciAdi.length >= 3)

    return (
        <div className="mt-16 p-6 w-full flex items-center justify-center bg-gradient-to-br px-4">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl exam-card"
            >
                <div className="flex mb-6 transition-all text-sm sm:text-base">
                    <button
                        className={`flex-1 py-2 font-semibold rounded-l-xl transition-all duration-300 ${mod === 'giris'
                            ? 'login-button shadow-md scale-105'
                            : 'button'
                            }`}
                        onClick={() => setMod('giris')}
                    >
                        Giriş Yap
                    </button>
                    <button
                        className={`flex-1 py-2 font-semibold rounded-r-xl transition-all duration-300 ${mod === 'kaydol'
                            ? 'signup-button shadow-md scale-105'
                            : 'button'
                            }`}
                        onClick={() => setMod('kaydol')}
                    >
                        Kaydol
                    </button>
                </div>

                <div className="space-y-5">
                    <FloatingInput
                        id="eposta"
                        type="email"
                        label="E-posta"
                        value={eposta}
                        onChange={(e) => setEposta(e.target.value)}
                    />

                    <AnimatePresence>
                        {mod === 'kaydol' && (
                            <motion.div
                                key="kullaniciAdi"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <FloatingInput
                                    id="kullaniciAdi"
                                    type="text"
                                    label="Kullanıcı Adı"
                                    value={kullaniciAdi}
                                    onChange={(e) => setKullaniciAdi(e.target.value)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <FloatingInput
                        id="sifre"
                        type="password"
                        label="Şifre"
                        value={sifre}
                        onChange={(e) => setSifre(e.target.value)}
                    />

                    <button
                        onClick={mod === 'giris' ? girisYap : kaydol}
                        disabled={!gonderimHazir || yükleniyor}
                        className={`w-full py-3 rounded-xl font-semibold transition-all flex justify-center items-center ${!gonderimHazir || yükleniyor
                            ? 'bg-gray-600 text-white cursor-not-allowed'
                            : mod === 'giris'
                                ? 'login-button'
                                : 'signup-button'
                            }`}
                    >
                        {yükleniyor ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : mod === 'giris' ? (
                            'Giriş Yap'
                        ) : (
                            'Kaydol'
                        )}
                    </button>

                    {mesaj && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-sm text-rose-600 mt-2"
                        >
                            {mesaj}
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
