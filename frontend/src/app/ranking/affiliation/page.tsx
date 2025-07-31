'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Roboto_Slab } from 'next/font/google';

import Top30ChartContainer from '@/components/affiliation/Top30ChartContainer';
import AffiliationConferenceGrid from '@/components/affiliation/AffiliationConferenceGrid';
import AffiliationList from '@/components/affiliation/AffiliationList';

const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
});

export default function AffiliationRankingPage() {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-red-800 h-16 flex items-center justify-between px-6 border-b">
        <div className="flex items-center gap-3">
          <Image
            src="/logo02.png"
            alt="AI Med Logo"
            width={60}
            height={40}
            priority
          />
          <div className={`${robotoSlab.className} text-xl font-bold text-white`}>
            AI MED RANKING
          </div>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 text-white text-lg font-semibold">
          Affiliation
        </div>

        <button
          onClick={() => router.back()}
          className="text-white text-sm underline"
        >
          Return
        </button>
      </header>

      {/* Main content */}
      <div className="w-full min-h-screen overflow-x-hidden px-3 py-4 pt-12">
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Affiliation List */}
          <div className="col-span-4 max-w-[580px] w-full h-full overflow-y-auto max-h-[95vh] border border-gray-300 rounded-lg bg-white shadow-sm">
            <AffiliationList />
          </div>

          {/* Right: Charts */}
          <div className="col-span-8 w-full flex flex-col gap-6">
          <div className="w-full max-h-[550px] overflow-y-auto pr-2 border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
            <AffiliationConferenceGrid />
          </div>
            <div className="w-full flex justify-center border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
              <Top30ChartContainer />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
