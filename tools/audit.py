# -*- coding: utf-8 -*-
"""Static production audit — SEO tags, duplicate IDs, structure across all pages."""
import io, os, re, glob, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CORE = ["index.html","products.html","price-list.html","blog.html","about.html","faq.html","contact.html","404.html"]
product_files = sorted(glob.glob(os.path.join(ROOT,"products","*.html")))
blog_files = sorted(glob.glob(os.path.join(ROOT,"blog","*.html")))

def read(p):
    return io.open(p, encoding="utf-8").read()

def tag(html, pattern):
    m = re.search(pattern, html, re.I)
    return m.group(1).strip() if m else None

def audit(path):
    html = read(path)
    rel = os.path.relpath(path, ROOT).replace("\\","/")
    r = {"file": rel, "issues": []}
    title = tag(html, r'<title>(.*?)</title>')
    desc  = tag(html, r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']')
    canon = tag(html, r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']')
    ogt   = tag(html, r'<meta\s+property=["\']og:title["\']\s+content=["\'](.*?)["\']')
    ogd   = tag(html, r'<meta\s+property=["\']og:description["\']\s+content=["\'](.*?)["\']')
    ogtype= "og:type" in html
    tw    = "twitter:card" in html
    jsonld= html.count('application/ld+json')
    r["title"] = title
    r["desc"] = desc
    if not title: r["issues"].append("missing <title>")
    if not desc: r["issues"].append("missing meta description")
    if not canon: r["issues"].append("missing canonical")
    if not ogt: r["issues"].append("missing og:title")
    if not ogd: r["issues"].append("missing og:description")
    if not ogtype: r["issues"].append("missing og:type")
    if not tw: r["issues"].append("missing twitter:card")
    # duplicate id
    ids = re.findall(r'\sid=["\']([^"\']+)["\']', html)
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup: r["issues"].append("duplicate id: " + ",".join(dup))
    # skip link + main
    if 'id="main"' not in html: r["issues"].append('missing id="main"')
    if 'lang="en"' not in html: r["issues"].append("missing lang")
    r["jsonld"] = jsonld
    r["hasBreadcrumbShell"] = 'class="breadcrumb"' in html
    r["hasFaqSchema"] = 'data-faq-schema' in html
    return r

results = [audit(os.path.join(ROOT,f)) for f in CORE]
presults = [audit(p) for p in product_files]
bresults = [audit(p) for p in blog_files]

# Cross-page duplicate title / description (core pages only; product titles come from JSON)
def dupes(rs, key):
    seen={}
    for r in rs:
        v=r.get(key)
        if v: seen.setdefault(v,[]).append(r["file"])
    return {v:f for v,f in seen.items() if len(f)>1}

print("=== CORE PAGES ===")
for r in results:
    print(f"{r['file']:20} jsonld={r['jsonld']} issues={r['issues'] or 'OK'}")
print("\nCore duplicate titles:", dupes(results,"title"))
print("Core duplicate descriptions:", dupes(results,"desc"))

print(f"\n=== PRODUCT PAGES ({len(presults)}) ===")
prod_issues = [r for r in presults if r["issues"]]
print("Product pages with issues:", len(prod_issues))
for r in prod_issues[:20]:
    print(f"  {r['file']}: {r['issues']}")
dt = dupes(presults,"title"); dd = dupes(presults,"desc")
print("Product duplicate titles:", {k:v for k,v in list(dt.items())[:10]})
print("Product duplicate descriptions:", {k:v for k,v in list(dd.items())[:10]})
jsonld_counts = {}
for r in presults: jsonld_counts[r["jsonld"]] = jsonld_counts.get(r["jsonld"],0)+1
print("Product JSON-LD block counts:", jsonld_counts)
no_faq = [r["file"] for r in presults if not r["hasFaqSchema"] and "index.html" not in r["file"]]
print("Product pages missing static FAQ schema:", len(no_faq), no_faq[:10])

print(f"\n=== BLOG ARTICLE PAGES ({len(bresults)}) ===")
blog_issues = [r for r in bresults if r["issues"]]
print("Blog pages with issues:", len(blog_issues))
for r in blog_issues[:20]:
    print(f"  {r['file']}: {r['issues']}")

print("\n=== PRODUCT CONTENT COMPLETENESS (products.json) ===")
with io.open(os.path.join(ROOT, "products.json"), encoding="utf-8") as f:
    _products = json.load(f)["products"]
CONTENT_FIELDS = ["whatIsIt", "traditionalBackground", "tasteProfileText", "howToEat", "whoShouldBuy"]
incomplete = [p["slug"] for p in _products if any(f not in p or not p[f] for f in CONTENT_FIELDS)]
print(f"Products missing long-form content fields: {len(incomplete)}/{len(_products)}", incomplete[:10])

# All internal links resolve to existing files?
print("\n=== INTERNAL LINK CHECK ===")
all_html = CORE + [os.path.relpath(p,ROOT).replace("\\","/") for p in product_files] + [os.path.relpath(p,ROOT).replace("\\","/") for p in blog_files]
existing = set(all_html) | {"", "/"}
broken = {}
for f in all_html:
    html = read(os.path.join(ROOT,f))
    for href in re.findall(r'href=["\'](/[^"\'#?]*)["\']', html):
        # normalize
        target = href.lstrip("/")
        if target == "" or target.endswith("/"):
            continue
        if target in ("css/style.css","js/main.js","js/products-data.js","manifest.webmanifest","assets/icons/favicon.svg","robots.txt","sitemap.xml"):
            continue
        if not os.path.exists(os.path.join(ROOT,target)):
            broken.setdefault(f,set()).add(href)
for f,hrefs in broken.items():
    print(f"  {f}: BROKEN -> {sorted(hrefs)}")
if not broken: print("  All internal file links resolve OK.")
