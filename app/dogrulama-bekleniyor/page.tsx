// app/dogrulama-bekleniyor/page.tsx

export default function DogrulamaBekleniyor() {
    return (
        <div className="flex items-center justify-center py-24">
            <div className="exam-card max-w-md w-full p-8 rounded-xl shadow-md text-center">
                <h1 className="text-2xl font-bold mb-4 text-blue-600">E-postanı kontrol et 📬</h1>
                <p className="text-gray-500">
                    Kaydını tamamlamak için e-posta adresine gönderdiğimiz doğrulama linkine tıklaman gerekiyor.
                </p>
                <p className="mt-4 text-sm text-red-500">
                    Gelen kutunu ve spam klasörünü kontrol etmeyi unutma.
                </p>
            </div>
        </div>
    )
}
