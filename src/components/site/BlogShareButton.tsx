'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';

interface BlogShareButtonProps {
  title: string;
  slug: string;
}

/**
 * Blog yazısı paylaşımı — Web Share API veya panoya kopyala.
 */
export function BlogShareButton({ title, slug }: BlogShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `https://gunentemizlik.com/blog/${slug}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url,
        });
      } catch {
        // kullanıcı iptal
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      } catch {
        console.error('Panoya kopyalanamadı');
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-slate-500 transition-colors hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      aria-label="Yazıyı paylaş"
    >
      <Share2 size={18} aria-hidden="true" />
      {copied ? 'Link kopyalandı' : 'Paylaş'}
    </button>
  );
}
