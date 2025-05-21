// app/etkinlikler/page.tsx
'use client';

import Link from 'next/link';
import { AcademicCapIcon, PuzzlePieceIcon, CalendarIcon, UsersIcon, AdjustmentsHorizontalIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const etkinlikler = [
    {
        title: 'Klasik Sınav',
        description: 'Kelimenin kökenini tahmin etmeye dayalı klasik sınav.',
        href: '/etkinlikler/klasik',
        icon: <LightBulbIcon className="h-8 w-8 text-indigo-500" />,
    },
    {
        title: 'Çoktan Seçmeli Sınav',
        description: 'Doğru anlamı dört şık arasından bul.',
        href: '/etkinlikler/coktan-secmeli',
        icon: <AdjustmentsHorizontalIcon className="h-8 w-8 text-indigo-500" />,
    },
    {
        title: 'Eşleştirme (YAKINDA)',
        description: 'Kelime eşleştirme oyunu.',
        href: '/etkinlikler/eslestirme',
        icon: <PuzzlePieceIcon className="h-8 w-8 text-indigo-500" />,
    },
    {
        title: 'Günlük Etkinlik (YAKINDA)',
        description: 'Her gün yenilenen özel bir soru seni bekliyor!',
        href: '/etkinlikler/gunluk',
        icon: <CalendarIcon className="h-8 w-8 text-indigo-500" />,
    },
    {
        title: 'Bulmaca (YAKINDA)',
        description: 'Etimolojik kelimelerle hazırlanmış çengel bulmaca.',
        href: '/etkinlikler/bulmaca',
        icon: <AcademicCapIcon className="h-8 w-8 text-indigo-500" />,
    },
    {
        title: 'Düello (YAKINDA)',
        description: 'Gerçek zamanlı rakiplerle karşı karşıya gel!',
        href: '/etkinlikler/duello',
        icon: <UsersIcon className="h-8 w-8 text-indigo-500" />,
    },
];

export default function Etkinlikler() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <h1 className="text-4xl font-bold mb-10 text-center">
                Etkinlikler
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {etkinlikler.map((etkinlik) => (
                    <div
                        key={etkinlik.title}
                        className="rounded-xl exam-card shadow-md p-6 flex flex-col justify-between transform hover:scale-105 hover:shadow-lg transition-all duration-300"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            {etkinlik.icon}
                            <h2 className="text-xl font-semibold">
                                {etkinlik.title}
                            </h2>
                        </div>
                        <p className="text-sm leading-relaxed mb-6">
                            {etkinlik.description}
                        </p>
                        <Link
                            href={etkinlik.href}
                            className="mt-auto inline-block text-center px-4 py-2 chosen-button rounded-md transition-all"
                        >
                            Başla
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
