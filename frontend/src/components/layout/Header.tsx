'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Roboto_Slab } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp, User, Heart, HelpCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchFavorites, removeFavorite, type FavoritePaper } from '@/lib/favoritesApi';

const robotoSlab = Roboto_Slab({ subsets: ['latin'], weight: '700', display: 'swap' });

const menuItems: Record<string, string[]> = {
  // Conference: ['ICLR', 'ICML', 'KDD', 'NeurIPS'],
  // Year: ['2020', '2021', '2022', '2023', '2024', '2025'],
  'Ranking Plot': ['Author', 'TBD', 'TBD', 'TBD'],
  Trend:['TBD',]
  // Map: ['XXX', 'XXX', 'XXX'],
  // AIChat: ['XXX', 'XXX', 'XXX'],
};

const CONF_INFO = [
  { key: 'ICLR', title: 'ICLR', full: 'International Conference on Learning Representations', count: 455, desc: '...' },
  { key: 'ICML', title: 'ICML', full: 'International Conference on Machine Learning', count: 628, desc: '...' },
  { key: 'NeurIPS', title: 'NeurIPS', full: 'Conference on Neural Information Processing Systems', count: 972, desc: '...' },
  { key: 'KDD', title: 'KDD', full: 'ACM SIGKDD Conference on Knowledge Discovery and Data Mining', count: 203, desc: '...' },
] as const;

interface HeaderProps {
  onSearch: (query: string) => void;
  onConferenceSelect: (conf: string) => void;
  onYearSelect: (year: string) => void;
  suggestions: string[];
}

export default function Header({ onSearch, onConferenceSelect, onYearSelect, suggestions }: HeaderProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);
  const [favLoading, setFavLoading] = useState(false);
  const [favItems, setFavItems] = useState<FavoritePaper[]>([]);
  const { user, openLogin, openAccount } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const filteredSuggestions = suggestions.filter((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

  const openMenu = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(label);
  };

  const closeMenuWithDelay = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpen(null);
      setExpandedHelp(null);
    }, 120);
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(null);
        setShowSuggestions(false);
        setExpandedHelp(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (open === 'fav' && user) {
      setFavLoading(true);
      fetchFavorites()
        .then((list) => setFavItems(list || []))
        .catch(() => setFavItems([]))
        .finally(() => setFavLoading(false));
    }
  }, [open, user]);

  const totalPapers = CONF_INFO.reduce((s, c) => s + c.count, 0);

  const getInitial = (name?: string) => {
    const n = (name || '').trim();
    if (!n) return '?';
    const ch = Array.from(n)[0] || '?';
    const en = /^[A-Za-z]$/.test(ch);
    return en ? ch.toUpperCase() : ch;
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-red-800">
      <div className="flex items-center justify-between px-6 h-16 border-b border-red-700/50">
        <div className="flex items-center gap-3">
          <Image src="/logo02.png" alt="AI Med Logo" width={60} height={40} priority />
          <div className={`${robotoSlab.className} text-2xl font-bold text-white`}>AI MED RANKING</div>
        </div>
        <nav ref={menuRef} className={`${robotoSlab.className} flex items-center gap-6 text-base text-white relative`}>
          {Object.entries(menuItems).map(([label, options]) => {
            const isOpen = open === label;
            return (
              <div
                key={label}
                className="relative flex items-center gap-1 cursor-pointer"
                onMouseEnter={() => openMenu(label)}
                onMouseLeave={closeMenuWithDelay}
              >
                <span className="hover:underline select-none">{label}</span>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {isOpen && (
                  <div
                    className="fixed left-0 right-0 top-16 bg-red-900/95 shadow-lg border-t border-red-700/50 z-50"
                    onMouseEnter={() => openMenu(label)}
                    onMouseLeave={closeMenuWithDelay}
                  >
                    <div className="max-w-7xl mx-auto px-10 py-4">
                      <div className="grid grid-cols-4 gap-8">
                        {options.map((opt, idx) => (
                          <div
                            key={`${label}-${opt}-${idx}`}
                            className="text-white text-sm cursor-pointer hover:underline text-center"
                            onClick={() => {
                              if (label === 'Conference') onConferenceSelect(opt);
                              else if (label === 'Year') onYearSelect(opt);
                              else if (label === 'Ranking Plot') router.push(`/ranking/${opt.toLowerCase()}`);
                              setOpen(null);
                              setExpandedHelp(null);
                            }}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="relative w-[450px]">
            <input
              type="text"
              placeholder="Search paper title..."
              value={searchTerm}
              onChange={(e) => {
                const v = e.target.value;
                setSearchTerm(v);
                onSearch(v);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full px-4 py-1.5 pr-10 rounded-md bg-[#dddddd] placeholder-gray-500 text-black text-sm focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  onSearch('');
                  setShowSuggestions(false);
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
            {showSuggestions && searchTerm.length > 0 && (
              <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow z-50 max-h-60 overflow-y-auto">
                {filteredSuggestions.length ? (
                  filteredSuggestions.map((t, idx) => (
                    <div
                      key={`suggest-${t}-${idx}`}
                      onClick={() => {
                        setSearchTerm('');
                        onSearch(t);
                        setShowSuggestions(false);
                      }}
                      className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {t}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-800">No matching results</div>
                )}
              </div>
            )}
          </div>

          <div
            className="relative flex items-center gap-1 cursor-pointer"
            onMouseEnter={() => openMenu('help')}
            onMouseLeave={closeMenuWithDelay}
          >
            <HelpCircle size={24} />
            {open === 'help' && (
              <div
                className="fixed left-0 right-0 top-16 bg-red-900/95 border-t border-red-700/60 z-50 shadow-lg"
                onMouseEnter={() => openMenu('help')}
                onMouseLeave={closeMenuWithDelay}
              >
                <div className="max-w-7xl mx-auto px-10 py-6">
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-white/90">
                    <div className="text-sm">AI MED RANKING currently indexes</div>
                    <div className="text-sm font-semibold">{totalPapers.toLocaleString()} papers</div>
                    <div className="ml-2 flex flex-wrap gap-2">
                      {CONF_INFO.map((c) => (
                        <span key={`pill-${c.key}`} className="text-xs px-2 py-1 rounded-full bg-red-800 border border-red-700/70">
                          {c.title} {c.count.toLocaleString()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="divide-y divide-red-700/50">
                    {CONF_INFO.map((c) => {
                      const expanded = expandedHelp === c.key;
                      return (
                        <div key={c.key} className="py-3">
                          <button
                            className="w-full flex items-start justify-between text-left text-white"
                            onClick={() => setExpandedHelp(expanded ? null : c.key)}
                            aria-expanded={expanded}
                          >
                            <div>
                              <div className="text-base font-semibold">{c.title} · {c.count.toLocaleString()} papers</div>
                              <div className="text-xs opacity-80">{c.full}</div>
                            </div>
                            {expanded ? <ChevronUp size={18} /> : <ChevronRight size={18} />}
                          </button>
                          {expanded && <div className="pt-2 text-sm text-white/90">{c.desc}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="relative flex items-center gap-1 cursor-pointer"
            onMouseEnter={() => openMenu('auth')}
            onMouseLeave={closeMenuWithDelay}
          >
            {user ? (
              <div className="w-7 h-7 rounded-full bg-white text-red-800 font-bold text-sm flex items-center justify-center ring-2 ring-white">
                {getInitial(user.name)}
              </div>
            ) : (
              <User size={24} />
            )}
            {open === 'auth' && (
              <div
                className="fixed left-0 right-0 top-16 bg-red-900/95 shadow-lg border-t border-red-700/50 z-50"
                onMouseEnter={() => openMenu('auth')}
                onMouseLeave={closeMenuWithDelay}
              >
                <div className="max-w-7xl mx-auto px-10">
                  <div className="py-6 flex flex-col items-center gap-4">
                    {user ? (
                      <>
                        <div className="text-white">
                          Welcome, <span className="font-semibold">{user.name}</span>
                        </div>
                        <button
                          className="px-6 py-2 rounded font-semibold text-white bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 transition-colors"
                          onClick={() => openAccount()}
                        >
                          My Account/ Logout
                        </button>
                      </>
                    ) : (
                      <button
                        className="px-6 py-2 rounded font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-colors"
                        onClick={() => openLogin()}
                      >
                        Sign In / Register
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="relative flex items-center gap-1 cursor-pointer"
            onMouseEnter={() => openMenu('fav')}
            onMouseLeave={closeMenuWithDelay}
          >
            <Heart size={24} />
            {open === 'fav' && (
              <div
                className="fixed left-0 right-0 top-16 bg-red-900/95 shadow-lg border-t border-red-700/50 z-50"
                onMouseEnter={() => openMenu('fav')}
                onMouseLeave={closeMenuWithDelay}
              >
                <div className="max-w-7xl mx-auto px-10 py-4">
                  {!user ? (
                    <div className="h-20 flex items-center justify-center text-white">
                      <button
                        className="px-5 py-2 rounded bg-white text-red-800 font-semibold"
                        onClick={() => openLogin()}
                      >
                        Sign in to view favorites
                      </button>
                    </div>
                  ) : favLoading ? (
                    <div className="h-20 flex items-center justify-center text-white">Loading...</div>
                  ) : favItems.length === 0 ? (
                    <div className="h-20 flex items-center justify-center text-white">You have no favorite papers yet!</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {favItems.slice(0, 12).map((p) => (
                        <div
                          key={p.id}
                          className="relative bg-red-800/40 border border-red-700/60 rounded-lg p-3 text-white hover:bg-red-800/60"
                        >
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              await removeFavorite(p.id);
                              setFavItems((prev) => prev.filter((item) => item.id !== p.id));
                            }}
                            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white text-sm"
                            title="Remove from favorites"
                          >
                            −
                          </button>
                          <Link href={`/paper/${p.id}`} className="block" onClick={() => setOpen(null)}>
                            <div className="text-sm font-semibold line-clamp-2">{p.title}</div>
                            <div className="text-xs opacity-80 mt-1 line-clamp-1">{p.authors?.join(', ') || '-'}</div>
                            <div className="text-[11px] mt-1 opacity-80">{p.conference} · {p.year}</div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
