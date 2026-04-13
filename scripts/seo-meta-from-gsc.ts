import fs from 'node:fs';
import path from 'node:path';
import { DISTRICT_LANDINGS, SERVICE_LANDINGS } from '../src/config/programmatic-seo';

type Row = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type Suggestion = {
  key: string;
  title: string;
  description: string;
  reason: string;
  score: number;
};

const DEFAULT_INPUT = path.resolve(process.cwd(), 'data', 'gsc-query-export.csv');
const DEFAULT_OUTPUT = path.resolve(
  process.cwd(),
  'src',
  'config',
  'programmatic-meta-overrides.json'
);

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
      const next = line[i + 1];
      if (inQuotes && next === '"') {
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

function toRows(csv: string): Row[] {
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
    throw new Error(
      'CSV içinde en az query/sorgu ve page/sayfa kolonları olmalı. Örn: query,page,clicks,impressions,ctr,position'
    );
  }

  const rows: Row[] = [];
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

function buildSuggestion(
  key: string,
  districtName: string,
  serviceName: string,
  topQuery: string,
  score: number
): Suggestion {
  const title = `${districtName} ${serviceName} | ${topQuery} - Günen Temizlik`;
  const description = `${districtName} için ${serviceName.toLowerCase()} hizmetinde ${topQuery} odaklı hızlı teklif alın. Aynı gün planlama ve şeffaf fiyatlandırma.`;
  return {
    key,
    title: title.slice(0, 70),
    description: description.slice(0, 160),
    reason: `Top query: ${topQuery}`,
    score,
  };
}

function main() {
  const inputPath = path.resolve(process.cwd(), process.argv[2] || DEFAULT_INPUT);
  const outputPath = path.resolve(process.cwd(), process.argv[3] || DEFAULT_OUTPUT);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input CSV bulunamadı: ${inputPath}`);
  }

  const csv = fs.readFileSync(inputPath, 'utf8');
  const rows = toRows(csv);

  const grouped = new Map<string, Row[]>();
  for (const row of rows) {
    const key = keyFromPage(row.page);
    if (!key) continue;
    const list = grouped.get(key) || [];
    list.push(row);
    grouped.set(key, list);
  }

  const knownKeys = new Set(
    DISTRICT_LANDINGS.flatMap((d) => SERVICE_LANDINGS.map((s) => `${d.slug}/${s.slug}`))
  );
  const overrides: Record<string, { title: string; description: string }> = {};
  const suggestions: Suggestion[] = [];

  for (const [key, bucket] of grouped) {
    if (!knownKeys.has(key)) continue;
    const [districtSlug, serviceSlug] = key.split('/');
    const district = DISTRICT_LANDINGS.find((d) => d.slug === districtSlug);
    const service = SERVICE_LANDINGS.find((s) => s.slug === serviceSlug);
    if (!district || !service) continue;

    bucket.sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
    const top = bucket[0];
    const score = top.impressions * 0.7 + top.clicks * 20 - top.position * 2;
    const suggestion = buildSuggestion(key, district.name, service.name, top.query, score);
    suggestions.push(suggestion);
  }

  suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)
    .forEach((s) => {
      overrides[s.key] = { title: s.title, description: s.description };
    });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(overrides, null, 2), 'utf8');

  const reportPath = path.resolve(process.cwd(), 'data', 'gsc-meta-suggestions-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(suggestions, null, 2), 'utf8');

  console.log(`GSC rows parsed: ${rows.length}`);
  console.log(`Override generated: ${Object.keys(overrides).length}`);
  console.log(`Override path: ${outputPath}`);
  console.log(`Detail report: ${reportPath}`);
}

main();
