import React, { useState, useMemo } from 'react'
import { papers } from '@/mock/papers'

type Props = {
  selectedConfs: string[]
  setSelectedConfs: (val: string[]) => void
  selectedYears: string[]
  setSelectedYears: (val: string[]) => void
  selectedAuthors: string[]
  setSelectedAuthors: (val: string[]) => void
  onApplyFilters?: () => void
  onClearFilters?: () => void
}

const SidebarFilters: React.FC<Props> = ({
  selectedConfs,
  setSelectedConfs,
  selectedYears,
  setSelectedYears,
  selectedAuthors,
  setSelectedAuthors,
  onApplyFilters,
  onClearFilters,
}) => {
  const [authorQuery, setAuthorQuery] = useState('')

  const toggle = (val: string, arr: string[], setter: (v: string[]) => void) => {
    if (arr.includes(val)) {
      setter(arr.filter((v) => v !== val))
    } else {
      setter([...arr, val])
    }
  }

  const allAuthors = useMemo(() => {
    const authorsSet = new Set<string>()
    papers.forEach((p) => {
      p.authors.forEach((a) => authorsSet.add(a))
    })
    return Array.from(authorsSet).sort()
  }, [])

  const filteredAuthors = useMemo(() => {
    return [...selectedAuthors, ...allAuthors.filter((a) => !selectedAuthors.includes(a))]
      .filter((a) => a.toLowerCase().includes(authorQuery.toLowerCase()))
      .slice(0, 50)
  }, [authorQuery, allAuthors, selectedAuthors])

  return (
    <div className="w-80 fixed left-0 top-20 px-6 py-6 border-r h-full overflow-y-auto bg-white">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Conference</h2>
        <div className="grid grid-cols-3 gap-2">
          {['ICLR', 'CVPR', 'ACL', 'KDD', 'WWW', 'ICML', 'NeurIPS', 'ICCV', 'ECCV', 'CHI', 'AAAI', 'IJCAI'].map((conf) => (
            <label key={conf} className="text-sm flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={selectedConfs.includes(conf)}
                onChange={() => toggle(conf, selectedConfs, setSelectedConfs)}
              />
              {conf}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Year</h2>
        <div className="grid grid-cols-3 gap-2">
          {['2020', '2021', '2022', '2023', '2024', '2025'].map((year) => (
            <label key={year} className="text-sm flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={selectedYears.includes(year)}
                onChange={() => toggle(year, selectedYears, setSelectedYears)}
              />
              {year}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Author</h2>

        <div className="relative mb-2">
          <span className="absolute left-2 top-1.5 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </span>

          <input
            type="text"
            className="w-full border border-red-500 pl-8 pr-8 py-1 text-sm rounded"
            placeholder="Search author..."
            value={authorQuery}
            onChange={(e) => setAuthorQuery(e.target.value)}
          />

          {authorQuery && (
            <button
              className="absolute right-2 top-1.5 text-gray-400 hover:text-black"
              onClick={() => setAuthorQuery('')}
            >
              &#x2715;
            </button>
          )}
        </div>

        <div className="w-full border border-red-500 max-h-40 overflow-y-auto border rounded p-2 text-sm">
          {filteredAuthors.map((author) => (
            <label key={author} className="block">
              <input
                type="checkbox"
                className="mr-2"
                checked={selectedAuthors.includes(author)}
                onChange={() => toggle(author, selectedAuthors, setSelectedAuthors)}
              />
              {author}
            </label>
          ))}
        </div>

        <div className="mt-2 text-right">
          <button
            className="text-xs text-gray-600 underline hover:text-black"
            onClick={() => setSelectedAuthors([])}
          >
            Reset Authors
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Topic</h2>
        <p className="text-gray-400 text-sm italic">[TBD]</p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Method</h2>
        <p className="text-gray-400 text-sm italic">[TBD]</p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Application</h2>
        <p className="text-gray-400 text-sm italic">[TBD]</p>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onApplyFilters}
          className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
        >
          Apply Filters
        </button>
        <button
          onClick={onClearFilters}
          className="border border-gray-500 text-gray-700 px-4 py-2 rounded hover:bg-gray-100"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

export default SidebarFilters
