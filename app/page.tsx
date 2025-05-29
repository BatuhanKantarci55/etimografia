'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  // Güncelleme verileri
  const updates = [
    {
      id: 1,
      title: "Haftalık liderlik tablosu",
      description: "Kullanıcıların haftalık performanslarını görebilecekleri dinamik bir liderlik tablosu",
      progress: 100
    },
    {
      id: 2,
      title: "500 kelimelik liste",
      description: "500 kelimeyi ve etimolojik kökenlerini içeren kapsamlı bir veri seti",
      progress: 85
    },
    {
      id: 3,
      title: "Günlük seri ve günlük etkinlik",
      description: "Her gün yeni bir kelime öğrenme serisi ve düzenli katılımı teşvik eden günlük ödüllü etkinlikler",
      progress: 75
    },
    {
      id: 4,
      title: "Yeni profil sayfası arayüzü",
      description: "Kullanıcı istatistiklerini daha görsel ve interaktif gösteren, kişiselleştirilebilir yeni profil tasarımı",
      progress: 65
    },
    {
      id: 5,
      title: "Başarım rozetleri",
      description: "Belirli hedeflere ulaşan kullanıcılar için rozet sistemi ve koleksiyon görünümü",
      progress: 60
    },
    {
      id: 6,
      title: "Eşleştirme modu",
      description: "Kelimeleri karşılıklarıyla eşleştirme, kökenlerine göre gruplandırma gibi yeni interaktif öğrenme yöntemleri.",
      progress: 50
    },
    {
      id: 7,
      title: "Düello modu",
      description: "Arkadaşlarınızla kelime bilginizi test edebileceğiniz eğlenceli düello sistemi",
      progress: 25
    },
    {
      id: 8,
      title: "Ses kapatma seçeneği",
      description: "Oyun seslerini kapatabileceğiniz kontrol butonu",
      progress: 10
    },
    {
      id: 9,
      title: "Mesajlaşma sekmesi",
      description: "Topluluk üyeleriyle birebir iletişim kurabileceğiniz ve kelime tartışabileceğiniz mesajlaşma platformu",
      progress: 0
    }
  ];

  return (
    <main className="flex flex-col items-center justify-center px-6 pt-16 bg-gradient-to-b">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-extrabold tracking-tight mb-6">
          Etimografia'ya Hoş Geldiniz
        </h1>
        <p className="text-lg mb-8">
          Kelimelerin kökenine yolculuk yapın. Etimolojik bilgilerle Türkçe'nin zenginliğini keşfedin.
        </p>
        <Link
          href="/etkinlikler"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-full text-white font-medium transition shadow-lg"
        >
          Öğrenmeye Başla <ArrowRight size={20} />
        </Link>
      </div>

      {/* Güncellemeler bölümü */}
      <div className="mt-12 max-w-2xl w-full px-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Güncellemeler</h2>
        <div className="space-y-6">
          {updates.map((update) => (
            <div key={update.id} className="bg-black/15 p-6 rounded-2xl shadow-lg">
              <h3 className="text-xl font-semibold mb-2">{update.title}</h3>
              <p className="text-sm mb-4">{update.description}</p>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="h-4 rounded-full relative"
                  style={{
                    width: `${update.progress}%`,
                    background: 'linear-gradient(90deg, #4f46e5 0%, #818cf8 50%, #4f46e5 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shine 8s linear infinite'
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <p className="text-xs mt-2 text-right">{update.progress}% tamamlandı</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ekstra içerik bölümü */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full px-4 pb-12">
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