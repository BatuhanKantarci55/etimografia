'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { puanGuncelle } from '@/lib/puan';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ZorlukSecim = 1 | 2 | 3 | 4 | 5 | 'karisik';

type EslesmeTipi = {
    id: number;
    eski: string;
    yeni: string;
    zorluk: number;
};

export default function EslestirmeSinav() {
    const [zorluk, setZorluk] = useState<ZorlukSecim>('karisik');
    const [basladi, setBasladi] = useState(false);
    const [bitti, setBitti] = useState(false);

    const [sure, setSure] = useState(60);
    const [puan, setPuan] = useState(0);
    const [dogruEslesmeler, setDogruEslesmeler] = useState<number[]>([]);
    const [aktifSecim, setAktifSecim] = useState<{ kelime: string; tip: 'eski' | 'yeni' } | null>(null);

    const [eslesmeler, setEslesmeler] = useState<EslesmeTipi[]>([]);
    const [mevcutSet, setMevcutSet] = useState<EslesmeTipi[]>([]);
    const [eskiList, setEskiList] = useState<EslesmeTipi[]>([]);
    const [yeniList, setYeniList] = useState<EslesmeTipi[]>([]);

    const [tur, setTur] = useState(0);
    const [dogruSayisi, setDogruSayisi] = useState(0);
    const [yanlisSayisi, setYanlisSayisi] = useState(0);
    const [kullanilanIdler, setKullanilanIdler] = useState<number[]>([]);

    const [geciciKirmizi, setGeciciKirmizi] = useState<string[]>([]);
    const timerRef = useRef<number>(0);

    const fetchEslesmeler = async () => {
        const { data } = await supabase
            .from('word_relations')
            .select(`id, difficulty, old_words(text), new_words(text)`);

        if (!data) return;

        const filtrelenmis = data
            .filter((d: any) => zorluk === 'karisik' || d.difficulty === zorluk)
            .map((d: any) => ({
                id: d.id,
                eski: d.old_words.text,
                yeni: d.new_words.text,
                zorluk: d.difficulty,
            }));

        setEslesmeler(filtrelenmis);
    };

    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const yeniSetOlustur = () => {
        const uygunEslesmeler = eslesmeler.filter(e => !kullanilanIdler.includes(e.id));
        const secilenler = shuffle(uygunEslesmeler).slice(0, 5);

        if (secilenler.length === 0) {
            // Yeni kelime kalmadıysa sınavı bitir
            clearInterval(timerRef.current!);
            setBasladi(false);
            setBitti(true);
            return;
        }

        setKullanilanIdler((prev) => [...prev, ...secilenler.map((e) => e.id)]);
        setMevcutSet(secilenler);
        setDogruEslesmeler([]);
        setAktifSecim(null);
        setTur((t) => t + 1);
        setEskiList(shuffle(secilenler));
        setYeniList(shuffle(secilenler));
    };

    const baslat = async () => {
        await fetchEslesmeler();
        setBasladi(true);
        setBitti(false);
        setSure(60);
        setPuan(0);
        setTur(0);
        setDogruSayisi(0);
        setYanlisSayisi(0);
        setGeciciKirmizi([]);
        setKullanilanIdler([]);
    };

    useEffect(() => {
        if (!basladi) return;
        yeniSetOlustur();
        timerRef.current = window.setInterval(() => {
            setSure((prev) => {
                if (prev <= 1) {
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

    const tikla = (kelime: string, tip: 'eski' | 'yeni') => {
        if (!aktifSecim) {
            setAktifSecim({ kelime, tip });
            return;
        }
        if (aktifSecim.tip === tip) {
            setAktifSecim({ kelime, tip });
            return;
        }

        const sec1 = aktifSecim;
        const sec2 = { kelime, tip };

        const dogru = mevcutSet.find(
            (m) =>
                (m.eski === sec1.kelime && m.yeni === sec2.kelime) ||
                (m.yeni === sec1.kelime && m.eski === sec2.kelime)
        );

        if (dogru && !dogruEslesmeler.includes(dogru.id)) {
            setDogruEslesmeler((p) => [...p, dogru.id]);
            setDogruSayisi((d) => d + 1);
            setPuan((p) => p + dogru.zorluk * 2);
            setSure((s) => s + 0.5);
        } else {
            setYanlisSayisi((y) => y + 1);
            setGeciciKirmizi([sec1.kelime, sec2.kelime]);
            setTimeout(() => {
                setGeciciKirmizi([]);
            }, 1000);
        }

        setAktifSecim(null);
    };

    const cikisOnayi = () => {
        if (confirm('Sınavı bitirmek istiyor musunuz?')) {
            clearInterval(timerRef.current!);
            setBasladi(false);
            setBitti(true);
        }
    };

    const tumEslesmelerDogru = dogruEslesmeler.length === mevcutSet.length;

    useEffect(() => {
        if (!basladi) return;
        const kalan = eslesmeler.filter(e => !kullanilanIdler.includes(e.id));
        if (kalan.length === 0 && tumEslesmelerDogru) {
            clearInterval(timerRef.current!);
            setTimeout(() => {
                setBasladi(false);
                setBitti(true);
            }, 500);
        }
    }, [tumEslesmelerDogru]);

    if (bitti) {
        puanGuncelle(puan);
        return (
            <div className="mt-16 p-6 flex items-center justify-center">
                <motion.div className="max-w-md w-full p-6 rounded-2xl shadow-md space-y-4 exam-card">
                    <h1 className="text-2xl font-bold text-center">⏱ Sınav Bitti!</h1>
                    <p>✅ Doğru Eşleşme: {dogruSayisi}</p>
                    <p>❌ Yanlış Deneme: {yanlisSayisi}</p>
                    <p className="text-xl font-semibold">🏆 Toplam Puan: {puan}</p>
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
            <motion.div className="mt-10 p-6 flex items-center justify-center">
                <div className="max-w-md w-full p-6 rounded-2xl shadow-md space-y-6 exam-card">
                    <h1 className="text-center text-2xl font-bold">Eşleştirme Sınavı Ayarları</h1>
                    <div>
                        <p className="font-semibold mb-2">Zorluk:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {(['karisik', 1, 2, 3, 4, 5] as ZorlukSecim[]).map((z) => (
                                <motion.button
                                    key={z}
                                    whileHover={{ scale: 1.03 }}
                                    onClick={() => setZorluk(z)}
                                    className={`cursor-pointer p-3 border rounded-full text-center transition-colors duration-200 ${zorluk === z ? 'chosen-button' : 'button'
                                        }`}
                                >
                                    {z === 'karisik' ? 'Karışık' : '⭐'.repeat(z)}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        onClick={baslat}
                        className="w-full cursor-pointer p-3 border rounded-full chosen-button"
                    >
                        Sınava Başla
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="mt-18 p-6 flex items-center justify-center relative">
            <button onClick={cikisOnayi} className="absolute top-4 right-4 p-1 rounded-full exam-card shadow">
                <X size={20} />
            </button>
            <motion.div className="max-w-md w-full p-6 rounded-2xl shadow-md space-y-6 exam-card">
                <div className="flex justify-between mb-4 text-sm">
                    <span>⏳ {sure}s</span>
                    <span>🏆 Puan: {puan}</span>
                    <span>🧠 Tur: {tur}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        {eskiList.map((k, i) => (
                            <motion.button
                                key={`eski-${i}`}
                                whileHover={{ scale: 1.03 }}
                                onClick={() => tikla(k.eski, 'eski')}
                                className={`w-full p-3 rounded-lg transition-colors duration-300 exam-card2
                                    ${aktifSecim?.kelime === k.eski ? 'chosen-exam-card' : ''}
                                    ${dogruEslesmeler.includes(k.id) ? 'right-option-card' : ''}
                                    ${geciciKirmizi.includes(k.eski) ? 'wrong-option-card' : ''}
                                `}
                            >
                                {k.eski}
                            </motion.button>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {yeniList.map((k, i) => (
                            <motion.button
                                key={`yeni-${i}`}
                                whileHover={{ scale: 1.03 }}
                                onClick={() => tikla(k.yeni, 'yeni')}
                                className={`w-full p-3 rounded-lg transition-colors duration-300 exam-card2
                                    ${aktifSecim?.kelime === k.yeni ? 'chosen-exam-card' : ''}
                                    ${dogruEslesmeler.includes(k.id) ? 'right-option-card' : ''}
                                    ${geciciKirmizi.includes(k.yeni) ? 'wrong-option-card' : ''}
                                `}
                            >
                                {k.yeni}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {tumEslesmelerDogru && (
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        onClick={yeniSetOlustur}
                        className="mt-6 w-full p-3 border rounded-full chosen-button"
                    >
                        Sonraki 5 Kelime
                    </motion.button>
                )}
            </motion.div>
        </div>
    );
}
