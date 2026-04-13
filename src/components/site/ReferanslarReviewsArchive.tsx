import type { PublicTestimonialRow } from '@/lib/testimonials-seo';

/**
 * Arama motorları için tüm yorum metinlerinin sunucuda HTML olarak render edilmesi.
 * Carousel yalnızca istemci tarafında olduğundan bu blok SEO için kritik.
 */
export function ReferanslarReviewsArchive({ items }: { items: PublicTestimonialRow[] }) {
  if (items.length === 0) {
    return (
      <section
        className="border-t border-slate-200 bg-slate-50 py-12 dark:border-slate-800 dark:bg-slate-900/50"
        aria-labelledby="archive-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="archive-heading" className="text-xl font-semibold text-slate-900 dark:text-white">
            Müşteri yorumları
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Henüz yayınlanmış referans bulunmuyor. Yorumlarınızı eklemek için yönetim panelinden &quot;Referanslar&quot;
            bölümünü kullanabilirsiniz.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/50"
      aria-labelledby="archive-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="archive-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl"
        >
          Tüm müşteri yorumları ({items.length})
        </h2>
        <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">
          Aşağıdaki metinler sitede yayınlanan referansların tamamıdır. İstanbul temizlik hizmetleri (ofis, ev, inşaat
          sonrası, halı ve koltuk yıkama vb.) hakkında gerçek kullanıcı ifadeleri içerir.
        </p>

        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => {
            const dateLabel = new Date(t.createdAt).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            return (
              <li key={t.id}>
                <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {'★'.repeat(Math.min(5, Math.max(1, t.rating)))}
                    <span className="sr-only"> {t.rating} üzerinden 5 yıldız</span>
                  </p>
                  <blockquote className="mt-3 flex-1 text-slate-700 dark:text-slate-200">
                    <p className="leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                  </blockquote>
                  <footer className="mt-4 border-t border-slate-100 pt-4 text-sm dark:border-slate-600">
                    <p className="font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    {(t.location || t.service) && (
                      <p className="mt-1 text-slate-500 dark:text-slate-400">
                        {[t.location, t.service].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <time className="mt-1 block text-xs text-slate-400" dateTime={t.createdAt.toISOString()}>
                      {dateLabel}
                    </time>
                  </footer>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
