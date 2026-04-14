'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Testimonials = dynamic(
  () => import('@/components/site/Testimonials').then((mod) => mod.Testimonials),
  {
    ssr: false,
    loading: () => <div className="h-80 bg-white animate-pulse" />,
  }
);

const BlogSection = dynamic(
  () => import('@/components/site/BlogSection').then((mod) => mod.BlogSection),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-slate-50 animate-pulse" />,
  }
);

const ContactForm = dynamic(
  () => import('@/components/site/ContactForm').then((mod) => mod.ContactForm),
  {
    ssr: false,
    loading: () => <div className="h-[600px] bg-white animate-pulse" />,
  }
);

function SectionLoading({ height = 'h-96' }: { height?: string }) {
  return (
    <div className={`${height} flex items-center justify-center bg-slate-100 animate-pulse`}>
      <span className="sr-only">Yükleniyor...</span>
    </div>
  );
}

export default function DeferredHomeSections() {
  return (
    <>
      <Suspense fallback={<SectionLoading height="h-80" />}>
        <Testimonials />
      </Suspense>

      <Suspense fallback={<SectionLoading height="h-96" />}>
        <BlogSection />
      </Suspense>

      <Suspense fallback={<SectionLoading height="h-[600px]" />}>
        <ContactForm />
      </Suspense>
    </>
  );
}
