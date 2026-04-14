/**
 * Harici video bağlantısını iframe src için dönüştürür (YouTube / Vimeo / diğer https).
 */
export function toVideoEmbedSrc(url: string): string | null {
  const u = url.trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt?.[1]) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm?.[1]) return `https://player.vimeo.com/video/${vm[1]}`;
  if (/^https:\/\//i.test(u)) return u;
  return null;
}
