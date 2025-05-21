import './globals.css';
import { Nunito } from 'next/font/google';
import NavBar from '../components/NavBar';
import SupabaseProvider from '@/components/SupabaseProvider';

const nunito = Nunito({
  weight: '800',
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata = {
  title: 'Etimografia',
  description: 'Eski Türkçe – Yeni Türkçe Sözlük ve Sınav Uygulaması',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${nunito.className} bg-white text-black dark:bg-black dark:text-white`}>
        <SupabaseProvider>
          <NavBar />
          <main className="pt-20">{children}</main>
        </SupabaseProvider>
      </body>
    </html>
  );
}
