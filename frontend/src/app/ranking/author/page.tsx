'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Roboto_Slab } from 'next/font/google';
import AuthorList from '@/components/author/AuthorList';
import Top30ChartContainer from '@/components/author/Top30ChartContainer';
import AuthorConferenceGrid from '@/components/author/AuthorConferenceGrid';
import { ArrowLeft, BookOpen } from 'lucide-react';

const robotoSlab = Roboto_Slab({ subsets: ['latin'], weight: ['700'], display: 'swap' });

export default function AuthorRankingPage() {
  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-red-800 h-16 flex items-center justify-between px-6 border-b">
        <div className="flex items-center gap-3">
          <img src="/logo02.png" alt="AI Med Logo" width={60} height={40}/>
          <div className={`${robotoSlab.className} text-xl font-bold text-white`}>AI MED RANKING</div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-white text-lg font-semibold">
          Author Ranking
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 bg-white text-red-800 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition"
          >
            <ArrowLeft size={16} /> Home
          </Link>
          <Link
            href="/ranking/topic"
            className="flex items-center gap-2 bg-white text-red-800 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition"
          >
            <BookOpen size={16} /> Topic Ranking
          </Link>
        </div>
      </header>

      <div className="w-full min-h-screen overflow-x-hidden px-6 py-4 pt-5">
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