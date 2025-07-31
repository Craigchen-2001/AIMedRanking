'use client';

import { useState } from 'react';
import { papers } from '@/mock/papers';

const getAuthorRanking = () => {
  const countMap: Record<string, number> = {};
  papers.forEach((paper) => {
    paper.authors.forEach((author) => {
      countMap[author] = (countMap[author] || 0) + 1;
    });
  });
  return Object.entries(countMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

const AuthorList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const allAuthors = getAuthorRanking();

  const filteredAuthors = searchTerm.trim()
    ? allAuthors.filter((author) =>
        author.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allAuthors;

  const searchedAuthor =
    searchTerm.trim() &&
    allAuthors.find(
      (author) => author.name.toLowerCase() === searchTerm.toLowerCase()
    );

  return (
    <div className="w-full h-full px-4 py-2">
      {/* Search */}
      <div className="w-full flex justify-start mb-3">
        <input
          type="text"
          placeholder="Search author name..."
          className="px-3 py-1 rounded border border-gray-300 w-52 text-sm"
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

      {/* Search result */}
      {searchedAuthor && (
        <div className="my-2 text-sm font-medium text-gray-900">
          <p>
            <span className="font-semibold">{searchedAuthor.name}</span> has{' '}
            <span className="text-blue-600">{searchedAuthor.count}</span> paper(s), ranked #{
              allAuthors.findIndex((a) => a.name === searchedAuthor.name) + 1
            }
          </p>
        </div>
      )}

      {/* Author table */}
      <div className="w-full h-[calc(100%-120px)] overflow-y-scroll border border-gray-300 rounded">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Author</th>
              <th className="px-3 py-2">Count</th>
            </tr>
          </thead>
          <tbody>
            {filteredAuthors.map((author, index) => (
              <tr key={author.name} className="border-t">
                <td className="px-3 py-2">{index + 1}</td>
                <td className="px-3 py-2 font-medium text-base">{author.name}</td>
                <td className="px-3 py-2">{author.count}</td>
              </tr>
            ))}
            {filteredAuthors.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-400 italic">
                  No matching authors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuthorList;
