'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { BookOpenText, Braces, Landmark, Activity, FileCode2, GitFork, X } from 'lucide-react';
import { fetchPaperById } from '@/lib/api';

type ExpandedCardProps = {
  paper: any;
  onClose: () => void;
};

function norm(s: string) {
  return String(s || '').toLowerCase().replace(/[\s_:-]/g, '');
}

function findKey(obj: any, targets: string[]) {
  if (!obj) return null;
  const map = Object.keys(obj).reduce<Record<string, string>>((m, k) => {
    m[norm(k)] = k;
    return m;
  }, {});
  for (const t of targets) {
    const hit = map[norm(t)];
    if (hit) return hit;
  }
  return null;
}

function extractAxis(v: any) {
  if (!v) return { main: null, sub: null };
  if (Array.isArray(v)) v = v[0] ?? null;
  if (typeof v === 'string') {
    const s = v.trim();
    try {
      const obj = JSON.parse(s);
      if (obj && typeof obj === 'object') return extractAxis(obj);
    } catch {}
    const m = s.match(/main\s*[:\-]\s*(.+?)(?:;|,|\|)/i);
    const subm = s.match(/sub\s*[:\-]\s*(.+)$/i);
    return { main: m ? m[1].trim() : (s || null), sub: subm ? subm[1].trim() : null };
  }
  if (v && typeof v === 'object') {
    const mk = findKey(v, ['MainTopic', 'Main Topic', 'Main', 'mainTopic', 'main_topic', 'main']);
    const sk = findKey(v, ['SubTopic', 'Sub Topic', 'Sub', 'subTopic', 'sub_topic', 'sub']);
    return { main: mk ? v[mk] : null, sub: sk ? v[sk] : null };
  }
  return { main: null, sub: null };
}

function readAxis(p: any, label: string) {
  if (!p) return { main: null, sub: null };
  const dbMap: Record<string, string[]> = {
    'Topic Axis I': ['topicAxis1', 'topicaxis1'],
    'Topic Axis II': ['topicAxis2', 'topicaxis2'],
    'Topic Axis III': ['topicAxis3', 'topicaxis3'],
  };
  const dbKey = findKey(p, dbMap[label] || []);
  if (dbKey) return extractAxis(p[dbKey]);
  const variants = [label, label + ':', label.replace('Axis ', 'Axis'), label.replace(/\s+/g, ' '), label.replace(/\s+/g, ' ').replace(':', '')];
  const key = findKey(p, variants);
  if (key) return extractAxis(p[key]);
  const mainTop = findKey(p, [label + ' MainTopic', label + ' Main Topic', label.replace(':', '') + ' MainTopic', label.replace(':', '') + ' Main Topic']);
  const subTop = findKey(p, [label + ' SubTopic', label + ' Sub Topic', label.replace(':', '') + ' SubTopic', label.replace(':', '') + ' Sub Topic']);
  return { main: mainTop ? p[mainTop] : null, sub: subTop ? p[subTop] : null };
}

function pick(p: any, keys: string[], fallback: any = 'N/A') {
  for (const k of keys) {
    const real = findKey(p, [k]);
    if (!real) continue;
    const val = p[real];
    if (val == null) continue;
    if (Array.isArray(val)) return val.filter((x) => x != null && x !== '').join(', ') || fallback;
    if (typeof val === 'object') {
      const txt = String((val as any)?.value ?? (val as any)?.name ?? '');
      if (txt) return txt;
    }
    if (String(val).trim() !== '') return val;
  }
  return fallback;
}

function deepClean(x: any) {
  try { return JSON.parse(JSON.stringify(x)) } catch { return x }
}

function snapshotAxis(o: any) {
  if (!o) return null;
  const take = (x: any) => x ? JSON.parse(JSON.stringify(x)) : x;
  return {
    a1: take(o?.topicAxis1 ?? o?.['Topic Axis I']),
    a2: take(o?.topicAxis2 ?? o?.['Topic Axis II']),
    a3: take(o?.topicAxis3 ?? o?.['Topic Axis III']),
  };
}

export default function ExpandedCard({ paper, onClose }: ExpandedCardProps) {
  const [item, setItem] = useState<any>(paper);

  useEffect(() => {
    setItem(paper);
  }, [paper]);

  useEffect(() => {
    console.groupCollapsed('Axis[List]', paper?.id || '');
    console.log(snapshotAxis(paper));
    console.groupEnd();
  }, [paper]);

  useEffect(() => {
    let alive = true;
    if (!paper?.id) return;
    fetchPaperById(paper.id)
      .then((full: any) => {
        if (!alive || !full) return;
        const merged = (full && (full.data || full.paper || full.result || full.item)) || full;
        console.groupCollapsed('Axis[Detail]', paper.id);
        console.log(snapshotAxis(merged));
        console.groupEnd();
        setItem((prev: any) => {
          const out: any = { ...prev, ...merged };
          console.groupCollapsed('Axis[Merged]', paper.id);
          console.log(snapshotAxis(out));
          console.groupEnd();
          (window as any).__paper_list = prev;
          (window as any).__paper_detail = merged;
          (window as any).__paper_merged = out;
          return out;
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [paper?.id]);

  useEffect(() => {
    const a1raw = item?.topicAxis1 ?? item?.['Topic Axis I'];
    const a2raw = item?.topicAxis2 ?? item?.['Topic Axis II'];
    const a3raw = item?.topicAxis3 ?? item?.['Topic Axis III'];
    const a1 = extractAxis(a1raw);
    const a2 = extractAxis(a2raw);
    const a3 = extractAxis(a3raw);
    console.groupCollapsed('AxisDebug', item?.id || '');
    console.table({ a1_main: a1.main, a1_sub: a1.sub, a2_main: a2.main, a2_sub: a2.sub, a3_main: a3.main, a3_sub: a3.sub });
    console.log('raw', deepClean({ a1raw, a2raw, a3raw }));
    (window as any).__paper = item;
    console.groupEnd();
  }, [item]);

  const ax1 = useMemo(() => readAxis(item, 'Topic Axis I'), [item]);
  const ax2 = useMemo(() => readAxis(item, 'Topic Axis II'), [item]);
  const ax3 = useMemo(() => readAxis(item, 'Topic Axis III'), [item]);

  const method = pick(item, ['method', 'Method']);
  const application = pick(item, ['application', 'Application']);
  const code = pick(item, ['code_link', 'code', 'Code']);
  const datasetRaw = pick(item, ['dataset_name', 'datasets', 'Datasets'], null);
  const datasets = Array.isArray(datasetRaw) ? datasetRaw.join(', ') : (datasetRaw || 'N/A');

  const codeHref = typeof code === 'string' && /^https?:\/\//i.test(code) ? code : '';

  const codeAvailable = useMemo(() => {
    let v: any = null;
    const cObj = typeof code === 'object' && code ? code : null;
    if (cObj) {
      const k = findKey(cObj, ['available', 'is_public', 'public', 'open', 'open_source']);
      v = k ? (cObj as any)[k] : null;
    }
    if (v == null) {
      const t = findKey(item, ['code_public', 'codeAvailable', 'code_available', 'is_public', 'public', 'isPublic']);
      v = t ? (item as any)[t] : null;
    }
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') {
      const s = norm(v);
      if (['true','yes','y','1','open','public','available','公開'].includes(s)) return true;
      if (['false','no','n','0','private','unavailable','未公開'].includes(s)) return false;
    }
    if (codeHref) return true;
    return false;
  }, [item, code, codeHref]);

  return (
    <Card className="w-full p-4 mt-2 bg-white rounded-2xl shadow-md border border-gray-200 relative z-10">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" aria-label="Close">
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 font-semibold">
        <Landmark size={14} /> Topic Axis I
      </div>
      <p className="text-sm ml-6 text-gray-800">
        <span className="font-semibold">Main Topic:</span> {ax1.main || 'N/A'}
        <br />
        <span className="font-semibold">Sub Topic:</span> {ax1.sub || 'N/A'}
      </p>

      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-semibold">
        <BookOpenText size={14} /> Topic Axis II
      </div>
      <p className="text-sm ml-6 text-gray-800">
        <span className="font-semibold">Main Topic:</span> {ax2.main || 'N/A'}
        <br />
        <span className="font-semibold">Sub Topic:</span> {ax2.sub || 'N/A'}
      </p>

      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-semibold">
        <Activity size={14} /> Topic Axis III
      </div>
      <p className="text-sm ml-6 text-gray-800">
        <span className="font-semibold">Main Topic:</span> {ax3.main || 'N/A'}
        <br />
        <span className="font-semibold">Sub Topic:</span> {ax3.sub || 'N/A'}
      </p>

      <hr className="my-3" />

      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-semibold">
        <Braces size={14} /> Method
      </div>
      <p className="text-sm ml-6 text-gray-800">{method}</p>

      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-semibold">
        <Activity size={14} /> Application
      </div>
      <p className="text-sm ml-6 text-gray-800">{application}</p>

      <hr className="my-3" />

      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-semibold">
        <FileCode2 size={14} /> Code
      </div>
      {codeHref ? (
        <a href={codeHref} target="_blank" rel="noopener noreferrer" className="text-sm ml-6 text-blue-600 underline break-all">
          {codeHref}
        </a>
      ) : (
        <div className="text-sm ml-6 text-blue-600 underline">N/A</div>
      )}

      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-semibold">
        <FileCode2 size={14} /> Code Availability
      </div>
      <p className="text-sm ml-6 text-gray-800">{codeAvailable ? 'Public' : 'Private'}</p>

      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-semibold">
        <GitFork size={14} /> Dataset(s)
      </div>
      <p className="text-sm ml-6 text-gray-800">{datasets}</p>
    </Card>
  );
}

