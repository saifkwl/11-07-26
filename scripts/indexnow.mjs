// Tell IndexNow (Bing, Yandex, Seznam, Naver...) which URLs are new or changed.
// Run AFTER the deploy is live, from the repo root:
//   node scripts/indexnow.mjs               -> every URL in the live sitemap
//   node scripts/indexnow.mjs /some-page/   -> only the given paths (new or updated pages)
// Proof of ownership is the public key file https://shikarpuriachar.pk/<key>.txt (repo root: 849e6ef95a92a9d28e569269d1a1ba8c.txt).
import { readFileSync } from 'node:fs';

const HOST = 'shikarpuriachar.pk';
const SITEMAP = 'https://shikarpuriachar.pk/sitemap.xml';
const KEY = readFileSync(new URL('../849e6ef95a92a9d28e569269d1a1ba8c.txt', import.meta.url), 'utf8').trim();
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const BATCH = 10000; // IndexNow limit per request

async function get(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res;
}

// Reads a sitemap; a sitemap index is followed into its child sitemaps.
async function sitemapUrls(url, seen = new Set()) {
  if (seen.has(url)) return [];
  seen.add(url);
  const xml = await (await get(url)).text();
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  if (!/<sitemapindex[\s>]/.test(xml)) return locs;
  const out = [];
  for (const child of locs) out.push(...(await sitemapUrls(child, seen)));
  return out;
}

// The key file must be live, or IndexNow rejects the request (403).
const live = (await (await get(KEY_LOCATION)).text()).trim();
if (live !== KEY) throw new Error(`${KEY_LOCATION} does not contain the key. Deploy first.`);

// Do not ping while the site is still noindex (staging).
const home = await get(`https://${HOST}/`);
const homeHtml = await home.text();
if (/noindex/i.test(home.headers.get('x-robots-tag') || '') ||
    /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(homeHtml)) {
  throw new Error(`https://${HOST}/ is noindex. Launch the site before using IndexNow.`);
}

const paths = process.argv.slice(2);
const urls = paths.length
  ? paths.map((p) => (p.startsWith('http') ? p : `https://${HOST}${p.startsWith('/') ? p : `/${p}`}`))
  : await sitemapUrls(SITEMAP);
const urlList = [...new Set(urls)].filter((u) => new URL(u).hostname === HOST);
if (!urlList.length) throw new Error('No URLs to submit');

let failed = false;
for (let i = 0; i < urlList.length; i += BATCH) {
  const batch = urlList.slice(i, i + BATCH);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: batch }),
  });
  console.log(`IndexNow: ${res.status} ${res.statusText} for ${batch.length} URLs (200/202 = accepted)`);
  const body = await res.text();
  if (body) console.log(body);
  if (res.status !== 200 && res.status !== 202) failed = true;
}
if (failed) process.exit(1);
