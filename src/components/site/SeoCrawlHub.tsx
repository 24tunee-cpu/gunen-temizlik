import Link from 'next/link';
import { PRIORITY_BLOG_LINKS, PRIORITY_CONVERSION_LINKS } from '@/lib/priority-seo-links';

export default function SeoCrawlHub() {
  return (
    <section className="border-y border-slate-800 bg-slate-900/95 py-10" aria-label="Oncelikli SEO sayfalari">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-white">Istanbul’da en cok aranan temizlik konulari</h2>
          <p className="mt-2 text-sm text-slate-300">
            Google taramasini hizlandirmak icin en yuksek niyetli hizmet ve blog sayfalarina hizli erisim.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-emerald-300 uppercase">Hizmet odakli sayfalar</h3>
              <ul className="mt-3 space-y-2">
                {PRIORITY_CONVERSION_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-slate-200 underline decoration-slate-500/70 underline-offset-4 transition-colors hover:text-emerald-300"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-emerald-300 uppercase">Oncelikli blog yazilari</h3>
              <ul className="mt-3 space-y-2">
                {PRIORITY_BLOG_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-slate-200 underline decoration-slate-500/70 underline-offset-4 transition-colors hover:text-emerald-300"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
