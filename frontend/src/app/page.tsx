//page.tsx
//page.tsx
'use client'

import React, { useState } from 'react'
import Header from '@/components/layout/Header'
import SidebarFilters from '@/components/layout/SidebarFilters'
import { papers } from '@/mock/papers'

export default function HomePage() {
  const [selectedConfs, setSelectedConfs] = useState<string[]>([])
  const [selectedYears, setSelectedYears] = useState<string[]>([])
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])

  const [pendingConfs, setPendingConfs] = useState<string[]>([])
  const [pendingYears, setPendingYears] = useState<string[]>([])
  const [pendingAuthors, setPendingAuthors] = useState<string[]>([])

  const [searchTerm, setSearchTerm] = useState<string>('')

  const applyFilters = () => {
    setSelectedConfs(pendingConfs)
    setSelectedYears(pendingYears)
    setSelectedAuthors(pendingAuthors)
  }

  const clearFilters = () => {
    setPendingConfs([])
    setPendingYears([])
    setPendingAuthors([])
    setSelectedConfs([])
    setSelectedYears([])
    setSelectedAuthors([])
  }

  const filteredPapers = papers.filter((paper) => {
    const confMatch = selectedConfs.length === 0 || selectedConfs.some((conf) =>
      paper.conference.toLowerCase().includes(conf.toLowerCase())
    )
    const yearMatch = selectedYears.length === 0 || selectedYears.includes(String(paper.year))
    const titleMatch = paper.title.toLowerCase().includes(searchTerm.toLowerCase())
    const authorMatch = selectedAuthors.length === 0 || selectedAuthors.some((author) =>
      paper.authors.includes(author)
    )
    return confMatch && yearMatch && titleMatch && authorMatch
  })

  const allTitles = papers.map((p) => p.title)

  return (
    <div className="min-h-screen">
      <Header
        suggestions={allTitles}
        onSearch={(term) => setSearchTerm(term)}
        onConferenceSelect={(conf) => setSelectedConfs([conf])}
        onYearSelect={(year) => setSelectedYears([year])}
      />

      <div className="flex pt-8">
        <SidebarFilters
          selectedConfs={pendingConfs}
          setSelectedConfs={setPendingConfs}
          selectedYears={pendingYears}
          setSelectedYears={setPendingYears}
          selectedAuthors={pendingAuthors}
          setSelectedAuthors={setPendingAuthors}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
        />

        <main className="flex-1 ml-80 p-6">
          {(selectedConfs.length > 0 || selectedYears.length > 0 || selectedAuthors.length > 0 || searchTerm) && (
            <div className="mb-6 pb-4 border-b text-sm text-gray-700 flex items-center justify-between">
              <div>
                Found <span className="font-semibold">{filteredPapers.length}</span> papers
                {selectedConfs.length > 0 && (
                  <> from <span className="font-semibold">{selectedConfs.join(', ')}</span></>
                )}
                {selectedYears.length > 0 && (
                  <> (<span className="font-semibold">{selectedYears.join(', ')}</span>)</>
                )}
                {selectedAuthors.length > 0 && (
                  <> by <span className="font-semibold">{selectedAuthors.join(', ')}</span></>
                )}
                {searchTerm && (
                  <> matching "<span className="italic">{searchTerm}</span>"</>
                )}
              </div>

              <div>
              <button
                className="ml-4 px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedConfs([]);
                  setSelectedYears([]);
                  setSelectedAuthors([]);
                  setPendingConfs([]);
                  setPendingYears([]);
                  setPendingAuthors([]);
                }}
              >
              Reset Filter
              </button>

              </div>
            </div>
          )}

          {filteredPapers.map((paper) => (
            <div key={paper.id} className="mb-6 border-b pb-4">
              <h3 className="text-blue-700 text-lg font-semibold hover:underline cursor-pointer">
                {paper.title}
              </h3>
              <div className="text-sm italic text-gray-700">
                {paper.authors.join(', ')}
              </div>
              <div className="text-sm text-gray-600">{paper.conference}</div>
              <div className="text-sm text-gray-600 mt-1">
                <a
                  href={paper.pdf_url}
                  className="text-blue-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View PDF
                </a>
              </div>
              <div className="mt-1 text-sm">
                <button className="text-blue-600 hover:underline">Show details</button>
              </div>
            </div>
          ))}
        </main>

      </div>
    </div>
  )
}
