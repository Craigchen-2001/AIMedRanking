'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { Roboto_Slab } from 'next/font/google';
import Image from 'next/image';

const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  weight: '700',
  display: 'swap',
});

const menuItems = {
  Conference: ['ICLR', 'ICML', 'CVPR', 'KDD', 'ACL', 'WWW', 'NeurIPS', 'ECCV', 'CHI', 'AAAI', 'IJCAI'],
  Year: ['2020', '2021', '2022', '2023', '2024', '2025'],
  'Ranking Plot': ['Author', 'Affiliation', 'Topic','Method','Application','Conference','Year'],
  Map: ['XXX', 'XXX', 'XXX'],
  AIChat: ['XXX', 'XXX', 'XXX'],
};

interface HeaderProps {
  onSearch: (query: string) => void;
  onConferenceSelect: (conf: string) => void;
  onYearSelect: (year: string) => void;
  suggestions: string[];
}

const Header = ({ onSearch, onConferenceSelect, onYearSelect, suggestions }: HeaderProps) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); 

  const toggleMenu = (label: string) => {
    setOpenMenu((prev) => (prev === label ? null : label));
  };

  const filteredSuggestions = suggestions.filter((title) =>
    title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSuggestionClick = (title: string) => {
    setSearchTerm('');
    onSearch(title);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full h-20 flex items-center justify-between px-6 py-4 border-b bg-red-800 z-50">
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

      <nav
        ref={menuRef}
        className={`${robotoSlab.className} flex items-center gap-6 text-base text-gray-100 relative`}
      >
        {Object.entries(menuItems).map(([label, options]) => (
          <div key={label} className="relative">
            <button
              onClick={() => toggleMenu(label)}
              className="hover:text-black focus:outline-none"
            >
              {label}
            </button>
            {openMenu === label && (
              <div className="absolute top-full left-0 bg-white shadow-md rounded-md mt-2 z-50">
                <ul className="w-48 py-2">
                  {options.map((option) => (
                    <li
                      key={option}
                      className="px-4 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
                      onClick={() => {
                        if (label === 'Conference') {
                          onConferenceSelect(option);
                        } else if (label === 'Year') {
                          onYearSelect(option);
                        } else if (label === 'Ranking Plot') {
                          router.push(`/ranking/${option.toLowerCase()}`); 
                        }
                        setOpenMenu(null);
                      }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search paper title..."
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              onSearch(value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full px-4 py-1.5 pr-10 rounded-md bg-[#dddddd] placeholder-gray-500 border border-white text-sm focus:outline-none focus:ring-2 focus:ring-white"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                onSearch('');
                setShowSuggestions(false);
              }}
              className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          )}
          {showSuggestions && searchTerm.length > 0 && (
            <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow z-50 max-h-60 overflow-y-auto">
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((title) => (
                  <div
                    key={title}
                    onClick={() => handleSuggestionClick(title)}
                    className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {title}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-800">
                  No matching results
                </div>
              )}
            </div>
          )}
        </div>

        <button className="border border-gray-300 px-3 py-1 rounded hover:bg-gray-100">
          About
        </button>
        <button className="bg-black text-white px-4 py-1 rounded hover:bg-gray-800">
          Login
        </button>
      </nav>
    </header>
  );
};

export default Header;
