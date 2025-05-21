'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';

type Kelime = {
    eski: string;
    yeni: string;
    zorluk: number;
    kokEski: string;
    kokYeni: string;
};

const getKokClass = (kok: string) => {
    switch (kok?.toLowerCase()) {
        case 'arapça':
            return 'bg-yellow-500 text-gray-800';
        case 'farsça':
            return 'bg-green-500 text-gray-800';
        case 'fransızca':
            return 'bg-purple-600 text-gray-100';
        case 'türkçe':
            return 'bg-red-600 text-gray-100';
        default:
            return 'bg-gray-600 text-gray-100';
    }
};

export default function Liste() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [kelimeler, setKelimeler] = useState<Kelime[]>([]);
    const [search, setSearch] = useState('');
    const [kokFilter, setKokFilter] = useState('hepsi');
    const [zorlukFilter, setZorlukFilter] = useState(0);
    const [sortField, setSortField] = useState<'eski' | 'yeni'>('eski');
    const [sortAsc, setSortAsc] = useState(true);
    const [loading, setLoading] = useState(true);

    // Sonra fetchData fonksiyonunu düzeltelim
    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('word_relations')
                .select(`
        difficulty,
        old_words(text, origin),
        new_words(origin, text)
      `);

            if (error) {
                console.error('Veri çekme hatası:', error);
                setLoading(false);
                return;
            }

            // Veriyi doğru şekilde tip kontrolü yaparak dönüştürüyoruz
            const kelimeListesi: Kelime[] = data?.map((item: unknown) => {
                const relation = item as {
                    difficulty: number;
                    old_words: { text: string; origin: string };
                    new_words: { origin: string; text: string };
                };

                return {
                    eski: relation.old_words.text,
                    yeni: relation.new_words.text,
                    zorluk: relation.difficulty,
                    kokEski: relation.old_words.origin,
                    kokYeni: relation.new_words.origin,
                };
            }) || [];

            setKelimeler(kelimeListesi);
            setLoading(false);
        };

        fetchData();
    }, [supabase]);

    const filtrelenmisKelimeler = useMemo(() => {
        const result = kelimeler.filter((k) => {
            const matchesSearch =
                k.eski?.toLowerCase().includes(search.toLowerCase()) ||
                k.yeni?.toLowerCase().includes(search.toLowerCase());

            const matchesKok =
                kokFilter === 'hepsi' ||
                k.kokEski?.toLowerCase() === kokFilter.toLowerCase() ||
                k.kokYeni?.toLowerCase() === kokFilter.toLowerCase();

            const matchesZorluk = zorlukFilter === 0 || k.zorluk === zorlukFilter;

            return matchesSearch && matchesKok && matchesZorluk;
        });

        result.sort((a, b) => {
            const valA = a[sortField]?.toLowerCase() || '';
            const valB = b[sortField]?.toLowerCase() || '';
            return sortAsc
                ? valA.localeCompare(valB, 'tr')
                : valB.localeCompare(valA, 'tr');
        });

        return result;
    }, [kelimeler, search, kokFilter, zorlukFilter, sortField, sortAsc]);

    const toggleSort = (field: 'eski' | 'yeni') => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(true);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <h1 className="text-4xl font-bold mb-6 text-center">Kelimeler Listesi</h1>

            {/* Arama ve filtre alanı */}
            <div className="space-y-6 mb-6">
                {/* Arama alanı */}
                <div className="flex justify-center">
                    <input
                        type="text"
                        placeholder="Kelime ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 px-5 py-3 rounded-full w-full max-w-md shadow-sm focus:outline-none focus:ring-3 focus:ring-gray-700 hover:scale-102 focus:scale-102 transition-all"
                    />
                </div>

                {/* Köken filtresi */}
                <div className="flex flex-wrap justify-center gap-2">
                    {['hepsi', 'arapça', 'farsça', 'fransızca', 'türkçe'].map((kok) => (
                        <button
                            key={kok}
                            onClick={() => setKokFilter(kok)}
                            className={`px-4 py-2 rounded-full font-medium hover:scale-105 transition-all duration-300 ${kokFilter === kok
                                ? 'chosen-list-button shadow-md hover:scale-105 transition-all'
                                : 'list-button'
                                }`}
                        >
                            {kok.charAt(0).toUpperCase() + kok.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Zorluk filtresi */}
                <div className="flex flex-wrap justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((z) => (
                        <button
                            key={z}
                            onClick={() => setZorlukFilter(z)}
                            className={`px-4 py-2 rounded-full font-medium hover:scale-105 transition-all duration-300 ${zorlukFilter === z
                                ? 'chosen-list-button shadow-md hover:scale-105 transition-all'
                                : 'list-button'
                                }`}
                        >
                            {z === 0 ? 'Tümü' : '⭐'.repeat(z)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sonuçlar */}
            {loading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-60"></div>
                </div>
            ) : filtrelenmisKelimeler.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Kayıt bulunamadı.</p>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="overflow-x-auto"
                >
                    <table className="w-full text-sm md:text-base text-center table-auto border-collapse">
                        <thead>
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                    onClick={() => toggleSort('eski')}
                                >
                                    Eski Türkçe {sortField === 'eski' ? (sortAsc ? '▼' : '▲') : ''}
                                </th>
                                <th className="px-4 py-3">Eski Köken</th>
                                <th
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                    onClick={() => toggleSort('yeni')}
                                >
                                    Yeni Türkçe {sortField === 'yeni' ? (sortAsc ? '▼' : '▲') : ''}
                                </th>
                                <th className="px-4 py-3">Yeni Köken</th>
                                <th className="px-4 py-3">Zorluk</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrelenmisKelimeler.map((k, i) => (
                                <tr
                                    key={i}
                                    className="hover:bg-blue-100 dark:hover:bg-gray-700 transition-all"
                                >
                                    <td className="px-4 py-2">{i + 1}</td>
                                    <td className="px-4 py-2">{k.eski}</td>
                                    <td className="px-4 py-2">
                                        <span className={`inline-block rounded px-2 py-1 text-sm font-medium ${getKokClass(k.kokEski)}`}>
                                            {k.kokEski}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">{k.yeni}</td>
                                    <td className="px-4 py-2">
                                        <span className={`inline-block rounded px-2 py-1 text-sm font-medium ${getKokClass(k.kokYeni)}`}>
                                            {k.kokYeni}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">{'⭐'.repeat(k.zorluk)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            )}
        </div>
    );
}