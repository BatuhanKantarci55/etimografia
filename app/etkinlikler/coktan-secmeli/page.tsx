'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { ArrowRightLeft, X } from 'lucide-react';
import { playCorrectSound, playWrongSound, playComboSound, playFireworksSound } from '@/utils/sounds';
import { puanGuncelle } from '@/lib/puan';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Yon = 'eski' | 'yeni';
type ZorlukSecim = 1 | 2 | 3 | 4 | 5 | 'karisik';

type SoruTipi = {
    soru: string;
    dogruCevap: string;
    secenekler: string[];
    zorluk: number;
};

export default function SecimliSinav() {
    const [yon, setYon] = useState<Yon>('eski');
    const [zorluk, setZorluk] = useState<ZorlukSecim>('karisik');
    const [basladi, setBasladi] = useState(false);
    const [bitti, setBitti] = useState(false);

    const [sorular, setSorular] = useState<SoruTipi[]>([]);
    const [indeks, setIndeks] = useState(0);
    const [cevap, setCevap] = useState<string | null>(null);
    const [sonuc, setSonuc] = useState<'dogru' | 'yanlis' | null>(null);
    const [streak, setStreak] = useState(0);

    const [sure, setSure] = useState(60);
    const [puan, setPuan] = useState(0);
    const [dogruSayisi, setDogruSayisi] = useState(0);
    const [yanlisSayisi, setYanlisSayisi] = useState(0);
    const [pasHakki, setPasHakki] = useState(5);
    const [comboAktif, setComboAktif] = useState(false);

    const timerRef = useRef<number>(0);

    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const fetchSorular = async () => {
        const { data } = await supabase
            .from('word_relations')
            .select(`
                difficulty,
                old_words(text),
                new_words(text)
            `);
        if (!data) return;

        const filtreli = data.filter((item: any) =>
            zorluk === 'karisik' || item.difficulty === zorluk
        );

        const secimliSorular: SoruTipi[] = filtreli.map((item: any) => {
            const soru = yon === 'eski' ? item.old_words.text : item.new_words.text;
            const dogruCevap = yon === 'eski' ? item.new_words.text : item.old_words.text;

            const alternatifler = filtreli
                .filter((alt: any) =>
                    (yon === 'eski' ? alt.new_words.text : alt.old_words.text) !== dogruCevap
                )
                .slice(0, 20);

            const secenekler = shuffle([
                dogruCevap,
                ...shuffle(alternatifler)
                    .slice(0, 3)
                    .map((alt: any) =>
                        yon === 'eski' ? alt.new_words.text : alt.old_words.text
                    )
            ]);

            return {
                soru,
                dogruCevap,
                secenekler,
                zorluk: item.difficulty,
            };
        });

        setSorular(shuffle(secimliSorular));
    };

    const baslat = async () => {
        await fetchSorular();
        setBasladi(true);
        setBitti(false);
        setSure(60);
        setPuan(0);
        setDogruSayisi(0);
        setYanlisSayisi(0);
        setPasHakki(5);
        setIndeks(0);
        setSonuc(null);
        setCevap(null);
        setStreak(0);
    };

    useEffect(() => {
        if (!basladi) return;
        timerRef.current = window.setInterval(() => {
            setSure(prev => {
                if (prev <= 1) {
                    playFireworksSound();
                    clearInterval(timerRef.current!);
                    setBasladi(false);
                    setBitti(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current!);
    }, [basladi]);

    const kontrolEt = (secim: string) => {
        if (!sorular[indeks]) return;
        const dogru = secim === sorular[indeks].dogruCevap;
        setCevap(secim);
        setSonuc(dogru ? 'dogru' : 'yanlis');

        if (dogru) {
            playCorrectSound();
            setPuan(p => p + sorular[indeks].zorluk * 2);
            setDogruSayisi(c => c + 1);
            setSure(s => s + 1);

            setStreak(s => {
                const yeniStreak = s + 1;
                if (yeniStreak >= 5 && !comboAktif) {
                    playComboSound();
                    setComboAktif(true);
                }
                return Math.min(5, yeniStreak);
            });
        } else {
            playWrongSound();
            setPuan(p => p - 5);
            setYanlisSayisi(c => c + 1);
            setStreak(0);
            setComboAktif(false); // KOMBO BİTER
        }

        // Soruların sonuncusuna geldiysek ve cevap verildiyse
        if (indeks + 1 >= sorular.length) {
            setTimeout(() => {
                clearInterval(timerRef.current!);
                setBasladi(false);
                setBitti(true);
            }, 1000); // kullanıcıya doğru/yanlış rengi gösterilsin
        }
    };

    const sonraki = () => {
        if (indeks + 1 >= sorular.length) {
            clearInterval(timerRef.current!);
            setBasladi(false);
            setBitti(true);
            return;
        }
        setIndeks(i => i + 1);
        setCevap(null);
        setSonuc(null);
    };

    const pasGec = () => {
        if (pasHakki > 0) {
            setPasHakki(p => p - 1);
            setStreak(0);
            setComboAktif(false); // KOMBO BİTER
            sonraki();
        }
    };

    const cikisOnayi = () => {
        if (confirm('Sınavı bitirmek istediğinize emin misiniz?')) {
            clearInterval(timerRef.current!);
            setBasladi(false);
            setBitti(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!basladi || cevap !== null || !sorular[indeks]) return;

            const keyMap: { [key: string]: number } = {
                4: 0,
                5: 1,
                1: 2,
                2: 3
            };

            const secenekler = sorular[indeks].secenekler;
            const index = keyMap[e.key.toLowerCase()];
            if (index !== undefined && secenekler[index]) {
                kontrolEt(secenekler[index]);
            }
        };

        const handleEnter = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && cevap !== null) {
                sonraki();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keydown', handleEnter);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keydown', handleEnter);
        };
    }, [basladi, cevap, sorular, indeks]);

    if (bitti) {
        puanGuncelle(puan);
        return (
            <div className="mt-16 p-6 flex items-center justify-center">
                <motion.div className="max-w-md w-full p-6 rounded-2xl shadow-md space-y-4 exam-card">
                    <h1 className="text-2xl font-bold text-center">⏱ Sınav Bitti!</h1>
                    <p>✅ Doğru: {dogruSayisi}</p>
                    <p>❌ Yanlış: {yanlisSayisi}</p>
                    <p className="text-xl font-semibold">🏆 Puan: {puan}</p>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        onClick={baslat}
                        className="w-full cursor-pointer p-3 border rounded-full chosen-button"
                    >Yeniden Başla</motion.button>
                </motion.div>
            </div>
        );
    }

    if (!basladi) {
        return (
            <div className="mt-10 p-6 flex items-center justify-center">
                <motion.div className="max-w-md w-full p-6 rounded-2xl shadow-md space-y-6 exam-card">
                    <h1 className="text-center text-2xl font-bold">Çoktan Seçmeli Sınav Ayarları</h1>
                    <div>
                        <p className="font-semibold mb-2">Yön:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                onClick={() => setYon('eski')}
                                className={`cursor-pointer p-4 border rounded-2xl text-center transition-colors duration-200 ${yon === 'eski' ? 'chosen-button' : 'button'}`}
                            >
                                <ArrowRightLeft className="inline-block mr-2" />Eski → Yeni
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                onClick={() => setYon('yeni')}
                                className={`cursor-pointer p-4 border rounded-2xl text-center transition-colors duration-200 ${yon === 'yeni' ? 'chosen-button' : 'button'}`}
                            >
                                <ArrowRightLeft className="inline-block mr-2 rotate-180" />Yeni → Eski
                            </motion.button>
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold mb-2">Zorluk:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {(['karisik', 1, 2, 3, 4, 5] as ZorlukSecim[]).map(z => (
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    key={z}
                                    onClick={() => setZorluk(z)}
                                    className={`cursor-pointer p-3 border rounded-full text-center transition-colors duration-200 ${zorluk === z ? 'chosen-button' : 'button'}`}
                                >{z === 'karisik' ? 'Karışık' : '⭐'.repeat(z)}</motion.button>
                            ))}
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        onClick={baslat}
                        disabled={!yon || !zorluk}
                        className="w-full cursor-pointer p-3 border rounded-full chosen-button"
                    >
                        Sınava Başla
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    const soru = sorular[indeks];
    if (!soru) return <div className="mt-16 p-6 text-center">Sorular yükleniyor...</div>;

    return (
        <div className="mt-16 p-6 flex items-center justify-center relative">
            <button onClick={cikisOnayi} className="absolute top-4 right-4 p-1 rounded-full exam-card shadow">
                <X size={20} />
            </button>
            <motion.div className="max-w-md w-full p-6 rounded-2xl shadow-md space-y-6 exam-card">
                <div className="flex justify-between text-sm">
                    <span>⏳ {sure}s</span>
                    <span>Soru {indeks + 1} / {sorular.length}</span>
                </div>
                {/* Kutucuklar */}
                <div className="relative flex flex-1 justify-center max-w-full">
                    {/* Kombo Yazısı */}
                    {streak >= 5 && (
                        <div className="absolute -top-8 sm:-top-0 text-gray-900 text-sm sm:text-lg font-bold animate-pulse z-10">
                            🔥 KOMBO MODU! +2 bonus puan 🔥
                        </div>
                    )}

                    {/* Çubuklar */}
                    <div className="flex w-full max-w-[600px] sm:max-w-[700px] md:max-w-[900px] space-x-0">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                className={`relative flex-1 h-6 overflow-hidden top-bar
        ${i === 1 ? 'rounded-l-full' : ''}
        ${i === 5 ? 'rounded-r-full' : ''}`}
                            >
                                {i <= streak && (
                                    <div
                                        className={`absolute top-0 left-0 h-full ${streak >= 5 ? 'fill-animate-gold' : 'fill-animate'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center">
                    <p className="mb-2 text-lg">Kelime:</p>
                    <div className="inline-block px-4 py-2 rounded-lg exam-card2">
                        {soru.soru}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Puan değeri: {soru.zorluk * 2}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {soru.secenekler.map(secim => (
                        <motion.button
                            key={secim}
                            whileHover={{ scale: 1.03 }}
                            onClick={() => kontrolEt(secim)}
                            disabled={cevap !== null}
                            className={`w-full p-3 rounded-full transition ${cevap === secim
                                ? (sonuc === 'dogru' ? 'right-option-card' : 'wrong-option-card')
                                : 'button'
                                }`}
                        >
                            {secim}
                        </motion.button>
                    ))}
                </div>

                {/* PAS BUTONU */}
                {cevap === null && indeks + 1 < sorular.length && (
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        onClick={pasGec}
                        className="w-full p-3 border rounded-full button"
                    >
                        Pas Geç
                    </motion.button>
                )}

                {cevap && indeks + 1 < sorular.length && (
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        onClick={sonraki}
                        className="w-full p-3 border rounded-full chosen-button"
                    >Sonraki</motion.button>
                )}
            </motion.div>
        </div>
    );
}