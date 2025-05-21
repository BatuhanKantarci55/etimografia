'use client';

import avatar10right from './resim/avatar10right.png';
import avatar11left from './resim/avatar11left.png';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { ArrowRightLeft, X, Clock } from 'lucide-react';
import { playCorrectSound, playWrongSound, playComboSound, playFireworksSound } from '@/utils/sounds';
import { puanGuncelle } from '@/lib/puan';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Yon = 'eski' | 'yeni';
type ZorlukSecim = 1 | 2 | 3 | 4 | 5 | 'karisik';

type Kelime = {
    eski: string;
    yeni: string;
    zorluk: number;
};

export default function Sinav() {
    const [yon, setYon] = useState<Yon>('eski');
    const [zorluk, setZorluk] = useState<ZorlukSecim>('karisik');
    const [basladi, setBasladi] = useState(false);
    const [bitti, setBitti] = useState(false);

    const [soruListesi, setSoruListesi] = useState<Kelime[]>([]);
    const [indeks, setIndeks] = useState(0);
    const [cevap, setCevap] = useState('');
    const [sonuc, setSonuc] = useState<'dogru' | 'yanlis' | null>(null);
    const [isChecked, setIsChecked] = useState(false);
    const [streak, setStreak] = useState(0);

    const [sure, setSure] = useState(60);
    const [puan, setPuan] = useState(0);
    const [dogruSayisi, setDogruSayisi] = useState(0);
    const [yanlisSayisi, setYanlisSayisi] = useState(0);
    const [pasHakki, setPasHakki] = useState(5);
    const [comboAktif, setComboAktif] = useState(false);


    const timerRef = useRef<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const shuffle = <T,>(array: T[]) => array.sort(() => Math.random() - 0.5);

    const fetchKelimeler = async () => {
        const { data } = await supabase
            .from('word_relations')
            .select(`difficulty, old_words(text), new_words(text)`);
        if (!data) return;
        const kelimeler: Kelime[] = data.map((item: any) => ({
            eski: item.old_words.text,
            yeni: item.new_words.text,
            zorluk: item.difficulty,
        }));
        const filtreli = kelimeler.filter(k =>
            zorluk === 'karisik' ? true : k.zorluk === zorluk
        );
        setSoruListesi(shuffle(filtreli));
    };

    const baslat = async () => {
        await fetchKelimeler();
        setBasladi(true);
        setBitti(false);
        setSure(60);
        setPuan(0);
        setDogruSayisi(0);
        setYanlisSayisi(0);
        setPasHakki(5);
        setIndeks(0);
        setSonuc(null);
        setCevap('');
        setStreak(0);
        setIsChecked(false);
    };

    useEffect(() => {
        if (!basladi) return;
        timerRef.current = window.setInterval(() => {
            setSure(prev => {
                if (prev <= 1) {
                    playFireworksSound();
                    clearInterval(timerRef.current!);
                    setBitti(true);
                    setBasladi(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current!);
    }, [basladi]);

    useEffect(() => {
        inputRef.current?.focus();
    }, [indeks, isChecked]);

    const normalize = (text: string) =>
        text
            .toLocaleLowerCase('tr-TR')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '');

    const kontrolEt = () => {
        if (isChecked) return;
        const soru = soruListesi[indeks];
        if (!soru) return;
        const dogruCevap = yon === 'eski' ? soru.yeni : soru.eski;
        const dogruMu = normalize(cevap.trim()) === normalize(dogruCevap);

        if (dogruMu) {
            playCorrectSound();
            setSonuc('dogru');
            const normalPuan = soru.zorluk * 5;
            const bonus = comboAktif ? 5 : 0;
            setPuan(p => p + normalPuan + bonus);
            setSure(s => s + 1);
            setDogruSayisi(d => d + 1);

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
            setSonuc('yanlis');
            setPuan(p => Math.max(0, p - 5));
            setYanlisSayisi(y => y + 1);
            setStreak(0);
            setComboAktif(false); // KOMBO BİTER
        }

        setIsChecked(true);
    };


    const sonraki = () => {
        setIndeks(i => i + 1);
        setCevap('');
        setSonuc(null);
        setIsChecked(false);
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            isChecked ? sonraki() : kontrolEt();
        }
    };

    if (bitti) {
        puanGuncelle(puan);
        return (
            <div className="mt-16 p-6 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="max-w-md w-full p-6 rounded-2xl shadow-md space-y-4 exam-card"
                >
                    <h1 className="text-2xl font-bold text-center">⏱ Sınav Bitti!</h1>
                    <p className="text-center text-lg font-semibold">🏆 Puan: {puan}</p>
                    <p>✅ Doğru: {dogruSayisi}</p>
                    <p>❌ Yanlış: {yanlisSayisi}</p>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        onClick={baslat}
                        className="w-full p-3 rounded-2xl chosen-button"
                    >
                        Yeniden Başla
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    if (!basladi) {
        return (
            <div className="mt-10 p-6 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-md w-full p-6 rounded-2xl shadow-md space-y-6 exam-card"
                >
                    <h1 className="text-center text-2xl font-bold">Klasik Sınav Ayarları</h1>

                    {/* Ayar butonları buraya gelecek */}
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

    const soru = soruListesi[indeks];
    if (!soru) return <div className="mt-16 text-center">Sorular yükleniyor...</div>;

    const toplamPuan = soru.zorluk * 5 + (comboAktif ? 5 : 0);

    return (
        <div className="mt-6 flex flex-col items-center">
            {/* Üst bar: Sayaç, 5 kutucuk, çıkış */}
            <div className="flex items-center justify-between w-full max-w-4xl mb-6 px-4 gap-4 flex-wrap sm:flex-nowrap">
                {/* Sayaç */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <Clock size={30} className="clock" />
                    <span className="font-semibold">{sure}s</span>
                </div>

                {/* Kutucuklar */}
                <div className="relative flex flex-1 justify-center max-w-full">
                    {/* Kombo Yazısı */}
                    {streak >= 5 && (
                        <div className="absolute -top-8 sm:-top-0 text-gray-900 text-sm sm:text-lg font-bold animate-pulse z-10">
                            🔥 KOMBO MODU! +5 bonus puan 🔥
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

                {/* Çıkış */}
                <div className="flex-shrink-0 flex items-center">
                    <button onClick={cikisOnayi}>
                        <X size={30} className="x" />
                    </button>
                </div>
            </div>

            {/* Başlık */}
            <h2 className="text-3xl mb-4">{yon === 'eski' ? 'Yeni Türkçe karşılığını yaz' : 'Eski Türkçe karşılığını yaz'}</h2>

            {/* Toplam puan göstergesi */}
            <div className="mb-2 text-lg font-semibold">
                ⭐ Toplam Puan: {puan}
            </div>

            {/* Soru bölümü */}
            <div className="w-full max-w-2xl h-68 relative mb-6 pt-12">
                {/* Sol üst (konuşma yukarıda değil, maskot hizasında) */}
                <div className="absolute -top-5 left-0 flex items-center space-x-2">
                    <Image src={avatar10right} alt="maskot sol" width={160} height={160} />
                    <div className="px-3 py-2 max-w-xs left-exam-box">
                        {yon === 'eski' ? soru.eski : soru.yeni}
                    </div>
                </div>

                {/* Sağ alt (konuşma balonu çok aşağıda değil, maskot hizasında) */}
                <div className="absolute -bottom-1 right-0 flex items-center space-x-2">
                    <div className="px-3 py-2 max-w-xs right-exam-box">
                        <input
                            ref={inputRef}
                            type="text"
                            value={cevap}
                            onChange={e => setCevap(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-transparent focus:outline-none w-full max-w-[150px]"
                            placeholder="Cevabınızı yaz"
                            readOnly={isChecked}
                        />
                    </div>
                    <Image src={avatar11left} alt="maskot sağ" width={160} height={160} />
                </div>
            </div>



            {/* Alt bar */}
            <div
                className={`w-full fixed bottom-0 left-0 z-10 shadow-lg h-32
        ${sonuc === 'yanlis' ? 'wrong-navbar' : sonuc === 'dogru' ? 'right-navbar' : 'exam-navbar'}`}
            >
                <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
                    {/* Sol - Puan */}
                    <div className="w-full sm:w-auto flex items-center justify-center sm:justify-start h-full">
                        <div className="font-bold text-xl">
                            ⭐ {soru.zorluk * 5} puan
                        </div>
                    </div>

                    {/* Orta mesaj alanı */}
                    <div className="flex-1 text-center text-base sm:text-lg flex items-center justify-center h-full">
                        {sonuc === 'dogru' && <span>
                            Doğru! +{toplamPuan} puan
                        </span>}
                        {sonuc === 'yanlis' && (
                            <span>Yanlış! Doğrusu: <span className="underline">{yon === 'eski' ? soru.yeni : soru.eski}</span></span>
                        )}
                    </div>

                    {/* Sağ butonlar */}
                    <div className="flex space-x-3 w-full sm:w-auto justify-center sm:justify-end items-center h-full">
                        {!sonuc && (
                            <button
                                onClick={pasGec}
                                disabled={pasHakki <= 0}
                                className="px-6 py-3 text-base font-semibold rounded-full pas-button disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Pas ({pasHakki})
                            </button>
                        )}
                        <button
                            onClick={sonuc ? sonraki : kontrolEt}
                            className={`px-6 py-3 text-base font-semibold rounded-full control-button
        ${sonuc === 'dogru' ? 'dogru' : ''}
        ${sonuc === 'yanlis' ? 'yanlis' : ''}`}
                        >
                            {sonuc ? 'Sonraki' : 'Kontrol Et'}
                        </button>
                    </div>
                </div>

            </div>



        </div>
    );
}
