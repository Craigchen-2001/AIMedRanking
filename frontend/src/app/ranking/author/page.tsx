'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Roboto_Slab } from 'next/font/google';
import AuthorList from '@/components/author/AuthorList';
import Top30ChartContainer from '@/components/author/Top30ChartContainer';
import AuthorConferenceGrid from '@/components/author/AuthorConferenceGrid';

const robotoSlab = Roboto_Slab({ subsets: ['latin'], weight: ['700'], display: 'swap' });

export default function AuthorRankingPage() {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-red-800 h-16 flex items-center justify-between px-6 border-b">
        <div className="flex items-center gap-3">
          <Image src="/logo02.png" alt="AI Med Logo" width={60} height={40} priority />
          <div className={`${robotoSlab.className} text-xl font-bold text-white`}>AI MED RANKING</div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-white text-lg font-semibold">Author</div>
        <button onClick={() => router.back()} className="text-white text-sm underline">Return</button>
      </header>

      <div className="w-full min-h-screen overflow-x-hidden px-6 py-4 pt-16">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 max-w-[580px] w-full h-full overflow-y-auto max-h-[95vh] border border-gray-300 rounded-lg bg-white shadow-sm">
            <AuthorList />
          </div>
          <div className="col-span-8 w-full flex flex-col gap-6">
            <div className="w-full max-h-[500px] overflow-y-auto pr-2 border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
              <AuthorConferenceGrid />
            </div>
            <div className="w-full max-h-[600px] flex justify-center border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
              <Top30ChartContainer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
