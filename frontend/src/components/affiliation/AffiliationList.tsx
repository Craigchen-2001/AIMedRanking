'use client';

import { useState } from 'react';
import { papers } from '@/mock/papers';

const getAffiliationRanking = () => {
  const countMap: Record<string, number> = {};

  papers.forEach((p) => {
    const affiliations = Array.isArray(p.affiliation)
      ? p.affiliation
      : [p.affiliation || 'N/A'];

    affiliations.forEach((aff) => {
      countMap[aff] = (countMap[aff] || 0) + 1;
    });
  });

  return Object.entries(countMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

const AffiliationList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const allAffiliations = getAffiliationRanking();

  const filteredAffiliations = searchTerm.trim()
    ? allAffiliations.filter((aff) =>
        aff.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allAffiliations;

  const searchedAff =
    searchTerm.trim() &&
    allAffiliations.find(
      (aff) => aff.name.toLowerCase() === searchTerm.toLowerCase()
    );

  return (
    <div className="w-full h-full px-4 py-2">
      <div className="w-full flex justify-start mb-3">
        <input
          type="text"
          placeholder="Search affiliation..."
          className="px-3 py-1 rounded border border-gray-300 w-64 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={() => setSearchTerm('')}
          className="ml-2 text-sm text-red-700 underline"
        >
          Clear
        </button>
      </div>

      {searchedAff && (
        <div className="my-2 text-sm font-medium text-gray-900">
          <p>
            <span className="font-semibold">{searchedAff.name}</span> has{' '}
            <span className="text-blue-600">{searchedAff.count}</span> paper(s), ranked #{
              allAffiliations.findIndex((a) => a.name === searchedAff.name) + 1
            }
          </p>
        </div>
      )}

      <div className="w-full h-[calc(100%-120px)] overflow-y-scroll border border-gray-300 rounded">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Affiliation</th>
              <th className="px-3 py-2">Count</th>
            </tr>
          </thead>
          <tbody>
            {filteredAffiliations.map((aff, index) => (
              <tr key={aff.name} className="border-t">
                <td className="px-3 py-2">{index + 1}</td>
                <td className="px-3 py-2 font-medium text-base">{aff.name}</td>
                <td className="px-3 py-2">{aff.count}</td>
              </tr>
            ))}
            {filteredAffiliations.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-400 italic">
                  No matching affiliations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AffiliationList;
