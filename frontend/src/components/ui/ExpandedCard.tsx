'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import {
  BookOpenText,
  Braces,
  Landmark,
  Activity,
  FileCode2,
  GitFork,
  X,
} from 'lucide-react';
import type { Paper } from '@/mock/papers';

type ExpandedCardProps = {
  paper: Paper;
  onClose: () => void;
};

export default function ExpandedCard({ paper, onClose }: ExpandedCardProps) {
  return (
    <Card className="w-full p-4 mt-2 bg-white rounded-2xl shadow-md border border-gray-200 relative z-10">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Topic Axis I */}
      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 font-semibold">
        <Landmark size={14} /> Topic Axis I
      </div>
      <p className="text-sm ml-6 text-gray-800">
        <span className="font-semibold">Main Topic:</span> {paper['Topic Axis I']?.MainTopic || 'N/A'}
        <br />
        <span className="font-semibold">Sub Topic:</span> {paper['Topic Axis I']?.SubTopic || 'N/A'}
      </p>

      {/* Topic Axis II */}
      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-semibold">
        <BookOpenText size={14} /> Topic Axis II
      </div>
      <p className="text-sm ml-6 text-gray-800">
        <span className="font-semibold">Main Topic:</span> {paper['Topic Axis II']?.MainTopic || 'N/A'}
        <br />
        <span className="font-semibold">Sub Topic:</span> {paper['Topic Axis II']?.SubTopic || 'N/A'}
      </p>

      {/* Topic Axis III */}
      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-semibold">
        <Activity size={14} /> Topic Axis III
      </div>
      <p className="text-sm ml-6 text-gray-800">
        <span className="font-semibold">Main Topic:</span> {paper['Topic Axis III']?.MainTopic || 'N/A'}
        <br />
        <span className="font-semibold">Sub Topic:</span> {paper['Topic Axis III']?.SubTopic || 'N/A'}
      </p>

      <hr className="my-3" />

      {/* Method */}
      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-semibold">
        <Braces size={14} /> Method
      </div>
      <p className="text-sm ml-6 text-gray-800">{paper.method || 'N/A'}</p>

      {/* Application */}
      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-semibold">
        <Activity size={14} /> Application
      </div>
      <p className="text-sm ml-6 text-gray-800">{paper.application || 'N/A'}</p>

      <hr className="my-3" />

      {/* Code Link */}
      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-semibold">
        <FileCode2 size={14} /> Code
      </div>
      <a
        href={paper.code_link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm ml-6 text-blue-600 underline break-all"
      >
        {paper.code_link || 'N/A'}
      </a>

      {/* Dataset */}
      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-semibold">
        <GitFork size={14} /> Dataset(s)
      </div>
      <p className="text-sm ml-6 text-gray-800">
        {Array.isArray(paper.dataset_name)
          ? paper.dataset_name.join(', ')
          : paper.dataset_name || 'N/A'}
      </p>
    </Card>
  );
}
