'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Roboto_Slab } from 'next/font/google';

const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
});

export default function AuthorRankingPage() {
  return (
    <div className="pt-20">
      <header className="fixed top-0 left-0 right-0 z-50 bg-red-800 h-20 flex items-center justify-between px-6 border-b">
        <div className="flex items-center gap-3">
          <Image
            src="/logo02.png"
            alt="AI Med Logo"
            width={70}
            height={50}
            priority
          />
          <div className={`${robotoSlab.className} text-2xl font-bold text-white`}>
            AI MED RANKING
          </div>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">
          Method
        </div>

        <Link href="/" className="text-white hover:underline text-sm">
          ← Back to Home
        </Link>
      </header>

      <main className="px-6 py-8">
        <p className="text-sm text-gray-400 italic">[Content coming soon]</p>
      </main>
    </div>
  );
}
