import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0B1120] px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-base font-semibold text-emerald-500">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Sayfa Bulunamadı
        </h1>
        <p className="mt-6 text-base leading-7 text-slate-400">
          Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir. Günen Temizlik olarak size en iyi hizmeti sunmaya devam etmek için buradayız.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/"
            className="rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors duration-200"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/iletisim"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
          >
            İletişime Geç <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </main>
  );
}