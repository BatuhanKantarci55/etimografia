'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { Star, X, Volume2, VolumeX } from 'lucide-react';
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
    const [sesAcik, setSesAcik] = useState(true); // Yeni eklenen ses durumu state'i

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

    // Ses çalma fonksiyonlarını sarmalayan yardımcı fonksiyon
    const playSound = (soundFunction: () => void) => {
        if (sesAcik) {
            soundFunction();
        }
    };

    const fetchSorular = useCallback(async () => {
        try {
            const { data: relations, error: relationsError } = await supabase
                .from('word_relations')
                .select('id, difficulty, old_word_id, new_word_id');

            if (relationsError) throw relationsError;
            if (!relations || relations.length === 0) {
                console.warn('Hiç ilişki verisi bulunamadı');
                return;
            }

            const { data: oldWords, error: oldWordsError } = await supabase
                .from('old_words')
                .select('id, text');

            const { data: newWords, error: newWordsError } = await supabase
                .from('new_words')
                .select('id, text');

            if (oldWordsError || newWordsError) throw oldWordsError || newWordsError;

            const combinedData = relations.map(relation => {
                const oldWord = oldWords?.find(w => w.id === relation.old_word_id);
                const newWord = newWords?.find(w => w.id === relation.new_word_id);

                return {
                    difficulty: relation.difficulty,
                    old_word: oldWord?.text || '',
                    new_word: newWord?.text || ''
                };
            });

            const filtreli = combinedData.filter(item =>
                zorluk === 'karisik' || item.difficulty === zorluk
            );

            const secimliSorular: SoruTipi[] = filtreli.map(item => {
                const soru = yon === 'eski' ? item.old_word : item.new_word;
                const dogruCevap = yon === 'eski' ? item.new_word : item.old_word;

                const alternatifler = filtreli
                    .filter(alt =>
                        (yon === 'eski' ? alt.new_word : alt.old_word) !== dogruCevap
                    )
                    .slice(0, 20);

                const secenekler = shuffle([
                    dogruCevap,
                    ...shuffle(alternatifler)
                        .slice(0, 3)
                        .map(alt => yon === 'eski' ? alt.new_word : alt.old_word)
                ]);

                return {
                    soru,
                    dogruCevap,
                    secenekler,
                    zorluk: item.difficulty,
                };
            });

            setSorular(shuffle(secimliSorular));
        } catch (error) {
            console.error('Veri çekme hatası:', error);
        }
    }, [yon, zorluk]);

    const baslat = useCallback(async () => {
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
    }, [fetchSorular]);

    const kontrolEt = useCallback((secim: string) => {
        if (!sorular[indeks]) return;
        const dogru = secim === sorular[indeks].dogruCevap;
        setCevap(secim);
        setSonuc(dogru ? 'dogru' : 'yanlis');

        if (dogru) {
            playSound(playCorrectSound);

            setStreak(prevStreak => {
                const newStreak = prevStreak + 1;

                if (newStreak === 5 && !comboAktif) {
                    playSound(playComboSound);
                    setComboAktif(true);
                }

                return newStreak;
            });

            setPuan(p => {
                let artanPuan = sorular[indeks].zorluk * 2;
                if (streak + 1 >= 5) {
                    artanPuan += 2;
                }
                return p + artanPuan;
            });

            setDogruSayisi(c => c + 1);
            setSure(s => s + 0.5);
        } else {
            playSound(playWrongSound);
            setPuan(p => Math.max(0, p - 5));
            setYanlisSayisi(c => c + 1);
            setStreak(0);
            setComboAktif(false);
        }

        if (indeks + 1 >= sorular.length) {
            setTimeout(() => {
                clearInterval(timerRef.current!);
                setBasladi(false);
                setBitti(true);
            }, 1000);
        }
    }, [sorular, indeks, comboAktif, streak, sesAcik]);

    const sonraki = useCallback(() => {
        if (indeks + 1 >= sorular.length) {
            clearInterval(timerRef.current!);
            setBasladi(false);
            setBitti(true);
            return;
        }
        setIndeks(i => i + 1);
        setCevap(null);
        setSonuc(null);
    }, [indeks, sorular.length]);

    const pasGec = useCallback(() => {
        if (pasHakki > 0) {
            setPasHakki(p => p - 1);
            setStreak(0);
            setComboAktif(false);
            sonraki();
        }
    }, [pasHakki, sonraki]);

    const cikisOnayi = useCallback(() => {
        if (confirm('Sınavı bitirmek istediğinize emin misiniz?')) {
            clearInterval(timerRef.current!);
            setBasladi(false);
            setBitti(false);
        }
    }, []);

    useEffect(() => {
        if (!basladi) return;

        timerRef.current = window.setInterval(() => {
            setSure(prev => {
                if (prev <= 1) {
                    playSound(playFireworksSound);
                    clearInterval(timerRef.current!);
                    setBasladi(false);
                    setBitti(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current!);
    }, [basladi, sesAcik]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!basladi || cevap !== null || !sorular[indeks]) return;

            const keyMap: Record<string, number> = {
                '4': 0,
                '5': 1,
                '1': 2,
                '2': 3
            };

            const secenekler = sorular[indeks].secenekler;
            const index = keyMap[e.key];
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
    }, [basladi, cevap, kontrolEt, sonraki, sorular, indeks]);

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
                    >
                        Yeniden Başla
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    if (!basladi) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-md w-full p-6 rounded-2xl shadow-md space-y-6 exam-card"
                >
                    <h1 className="text-center text-2xl font-bold">Çoktan Seçmeli Sınav Ayarları</h1>

                    <div className="flex justify-end">
                        <button
                            onClick={() => setSesAcik(!sesAcik)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            title={sesAcik ? "Sesleri Kapat" : "Sesleri Aç"}
                        >
                            {sesAcik ? <Volume2 size={30} /> : <VolumeX size={30} />}
                        </button>
                    </div>

                    <div>
                        <p className="font-semibold mb-2">Yön:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                onClick={() => setYon('eski')}
                                className={`cursor-pointer p-4 border rounded-2xl text-center transition-colors duration-200 ${yon === 'eski' ? 'chosen-button' : 'button'}`}
                            >Eski → Yeni
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                onClick={() => setYon('yeni')}
                                className={`cursor-pointer p-4 border rounded-2xl text-center transition-colors duration-200 ${yon === 'yeni' ? 'chosen-button' : 'button'}`}
                            >Yeni → Eski
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
                                >
                                    {z === 'karisik' ? 'Karışık' : (
                                        <div className="flex justify-center gap-1">
                                            {Array(z).fill(0).map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-current text-yellow-500" />
                                            ))}
                                        </div>
                                    )}
                                </motion.button>
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
        <div className="md:mt-16 p-6 flex items-center justify-center relative">
            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={cikisOnayi} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <X size={20} />
                </button>
            </div>

            <motion.div className="max-w-md w-full p-6 rounded-2xl shadow-md space-y-6 exam-card">
                <div className="flex justify-between text-sm">
                    <span>⏳ {sure}s</span>
                    <span>Soru {indeks + 1} / {sorular.length}</span>
                </div>

                {streak >= 5 && (
                    <div className="absolute top-23 pl-5 md:top-23 md:pl-14 text-red-700 md:text-lg font-bold animate-pulse z-10">
                        KOMBO MODU! +2 bonus puan
                    </div>
                )}

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

                <div className="text-center">
                    <p className="mb-2 text-lg">Kelime:</p>
                    <div className="inline-block px-4 py-2 rounded-lg exam-card2">
                        {soru.soru}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Puan değeri: {soru.zorluk * 2}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {soru.secenekler.map((secim, i) => (
                        <motion.button
                            key={i}
                            whileHover={{ scale: 1.03 }}
                            onClick={() => kontrolEt(secim)}
                            disabled={cevap !== null}
                            className={`w-full p-3 rounded-full transition ${cevap === secim
                                ? sonuc === 'dogru'
                                    ? 'right-option-card'
                                    : 'wrong-option-card'
                                : secim === soru.dogruCevap && cevap !== null && sonuc === 'yanlis'
                                    ? 'right-option-card'
                                    : 'button'
                                }`}
                        >
                            {secim}
                        </motion.button>
                    ))}
                </div>

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
                    >
                        Sonraki
                    </motion.button>
                )}
            </motion.div>
        </div>
    );
}