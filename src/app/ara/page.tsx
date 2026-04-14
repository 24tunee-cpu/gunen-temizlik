'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Loader2 } from 'lucide-react';
import SiteLayout from '../site/layout';

type Hit = { type: string; title: string; href: string; excerpt?: string; question?: string; shortDesc?: string };

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<{ blog: Hit[]; faq: Hit[]; services: Hit[] } | null>(null);

  const run = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setHits(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term.trim())}`);
      const data = (await res.json()) as { blog: Hit[]; faq: Hit[]; services: Hit[] };
      setHits(data);
    } catch {
      setHits({ blog: [], faq: [], services: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const initial = sp.get('q') || '';
    if (initial) {
      setQ(initial);
      void run(initial);
    }
  }, [run]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(q);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('q', q.trim());
      window.history.replaceState({}, '', url.toString());
    }
  };

  const flat: Hit[] = hits
    ? [...(hits.blog || []), ...(hits.services || []), ...(hits.faq || [])]
    : [];

  return (
    <SiteLayout>
      <div className="min-h-[60vh] bg-slate-50 py-10 dark:bg-slate-900">
        <div className="mx-auto max-w-2xl px-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sitede ara</h1>
          <form onSubmit={onSubmit} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="En az 2 karakter…"
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500"
            >
              Ara
            </button>
          </form>
          {loading ? (
            <div className="mt-8 flex justify-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : flat.length > 0 ? (
            <ul className="mt-8 space-y-3">
              {flat.map((h) => (
                <li key={`${h.type}-${h.href}`}>
                  <Link
                    href={h.href}
                    className="block rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                  >
                    <span className="text-xs font-medium uppercase text-emerald-600 dark:text-emerald-400">
                      {h.type === 'blog' ? 'Blog' : h.type === 'service' ? 'Hizmet' : 'SSS'}
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-white">{h.title || h.question}</p>
                    {(h.excerpt || h.shortDesc) && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                        {h.excerpt || h.shortDesc}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : hits ? (
            <p className="mt-8 text-center text-slate-600 dark:text-slate-400">Sonuç bulunamadı.</p>
          ) : null}
        </div>
      </div>
    </SiteLayout>
  );
}
