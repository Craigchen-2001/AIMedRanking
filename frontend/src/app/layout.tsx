// frontend/src/app/layout.tsx
import '../styles/globals.css';
import { Geist, Roboto_Slab, Inter } from 'next/font/google';
import type { Metadata } from 'next';
import AuthProvider from '@/components/auth/AuthProvider';

const robotoSlab = Roboto_Slab({ subsets: ['latin'], weight: ['700'], display: 'swap' });
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'AI MED RANKING',
  description: 'AI in Medicine papers — search, filter, and visualize.',
  icons: { icon: [{ url: '/favicon.ico' }], apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${inter.className} antialiased`}>
        <AuthProvider>
          <main className="w-full pt-15 overflow-hidden flex justify-center">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
