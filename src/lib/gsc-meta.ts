import { DISTRICT_LANDINGS, SERVICE_LANDINGS } from '@/config/programmatic-seo';

export type GscRow = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type MetaSuggestion = {
  key: string;
  district: string;
  service: string;
  title: string;
  description: string;
  reason: string;
  score: number;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

function normalizeHeader(v: string): string {
  return v.trim().toLowerCase();
}

function parseNumber(v: string): number {
  const cleaned = v.replace('%', '').trim().replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseGscCsv(csv: string): GscRow[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const idx = {
    query: headers.findIndex((h) => ['query', 'queries', 'top queries', 'sorgu'].includes(h)),
    page: headers.findIndex((h) => ['page', 'pages', 'top pages', 'sayfa'].includes(h)),
    clicks: headers.findIndex((h) => ['clicks', 'tıklamalar'].includes(h)),
    impressions: headers.findIndex((h) => ['impressions', 'gösterimler'].includes(h)),
    ctr: headers.findIndex((h) => ['ctr'].includes(h)),
    position: headers.findIndex((h) => ['position', 'ortalama konum'].includes(h)),
  };

  if (idx.query === -1 || idx.page === -1) {
    throw new Error('CSV içinde en az query/sorgu ve page/sayfa kolonları olmalı.');
  }

  const rows: GscRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const query = (cols[idx.query] ?? '').trim();
    const page = (cols[idx.page] ?? '').trim();
    if (!query || !page) continue;
    rows.push({
      query,
      page,
      clicks: idx.clicks === -1 ? 0 : parseNumber(cols[idx.clicks] ?? '0'),
      impressions: idx.impressions === -1 ? 0 : parseNumber(cols[idx.impressions] ?? '0'),
      ctr: idx.ctr === -1 ? 0 : parseNumber(cols[idx.ctr] ?? '0'),
      position: idx.position === -1 ? 99 : parseNumber(cols[idx.position] ?? '99'),
    });
  }
  return rows;
}

function keyFromPage(urlOrPath: string): string | null {
  const m = urlOrPath.match(/\/bolgeler\/([^/]+)\/([^/?#]+)/);
  if (!m) return null;
  return `${m[1]}/${m[2]}`;
}

export function buildMetaSuggestions(rows: GscRow[]): MetaSuggestion[] {
  const grouped = new Map<string, GscRow[]>();
  for (const row of rows) {
    const key = keyFromPage(row.page);
    if (!key) continue;
    const arr = grouped.get(key) || [];
    arr.push(row);
    grouped.set(key, arr);
  }

  const knownKeys = new Set(
    DISTRICT_LANDINGS.flatMap((d) => SERVICE_LANDINGS.map((s) => `${d.slug}/${s.slug}`))
  );
  const suggestions: MetaSuggestion[] = [];

  for (const [key, bucket] of grouped) {
    if (!knownKeys.has(key)) continue;
    const [districtSlug, serviceSlug] = key.split('/');
    const district = DISTRICT_LANDINGS.find((d) => d.slug === districtSlug);
    const service = SERVICE_LANDINGS.find((s) => s.slug === serviceSlug);
    if (!district || !service) continue;

    bucket.sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
    const top = bucket[0];
    const score = top.impressions * 0.7 + top.clicks * 20 - top.position * 2;
    const title = `${district.name} ${service.name} | ${top.query} - Günen Temizlik`.slice(0, 70);
    const description = `${district.name} için ${service.name.toLowerCase()} hizmetinde ${top.query} odaklı hızlı teklif alın. Aynı gün planlama ve şeffaf fiyatlandırma.`.slice(
      0,
      160
    );

    suggestions.push({
      key,
      district: district.slug,
      service: service.slug,
      title,
      description,
      reason: `Top query: ${top.query}`,
      score,
      query: top.query,
      clicks: top.clicks,
      impressions: top.impressions,
      ctr: top.ctr,
      position: top.position,
    });
  }

  return suggestions.sort((a, b) => b.score - a.score);
}
