'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center px-6 pt-24 bg-gradient-to-b">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-extrabold tracking-tight mb-6">
          Etimografia'ya Hoş Geldiniz
        </h1>
        <p className="text-lg mb-8">
          Kelimelerin kökenine yolculuk yapın. Etimolojik bilgilerle Türkçe’nin zenginliğini keşfedin.
        </p>
        <Link
          href="/etkinlikler"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-full text-white font-medium transition shadow-lg"
        >
          Öğrenmeye Başla <ArrowRight size={20} />
        </Link>
      </div>

      {/* Ekstra içerik bölümü */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full px-4">
        <div className="bg-black/15 p-6 rounded-2xl shadow-lg text-center">
          <h3 className="text-xl font-semibold mb-2">Etkinlikler</h3>
          <p className="text-sm">Kelime oyunları ve testlerle bilgini sınayabilirsin.</p>
        </div>
        <div className="bg-black/15 p-6 rounded-2xl shadow-lg text-center">
          <h3 className="text-xl font-semibold mb-2">Liderlik</h3>
          <p className="text-sm">Puan topla ve sıralamada yüksel.</p>
        </div>
        <div className="bg-black/15 p-6 rounded-2xl shadow-lg text-center">
          <h3 className="text-xl font-semibold mb-2">Topluluk</h3>
          <p className="text-sm">Arkadaşlarını ekle, beraber öğrenin.</p>
        </div>
      </div>
    </main>
  );
}
