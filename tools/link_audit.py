# -*- coding: utf-8 -*-
"""Complete internal-link audit: every static href + every JS-template
href pattern, checked against the real filesystem (case-sensitive)."""
import io, os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def all_files_lower():
    m = {}
    for dp, _, fns in os.walk(ROOT):
        if ".git" in dp or "tools" in dp:
            continue
        for fn in fns:
            rel = os.path.relpath(os.path.join(dp, fn), ROOT).replace("\\", "/")
            m[rel.lower()] = rel
    return m

FILES_LOWER = all_files_lower()

STATIC_ASSETS = {
    "css/style.css", "js/main.js", "js/products-data.js",
    "manifest.webmanifest", "assets/icons/favicon.svg",
    "robots.txt", "sitemap.xml", "products.json", "reviews.json",
}

def resolve(href, from_file):
    """Resolve an href found in from_file to a repo-relative path, or None if external/anchor."""
    if not href or href.startswith(("http://", "https://", "mailto:", "tel:", "#", "javascript:")):
        return None
    href = href.split("#")[0].split("?")[0]
    if href == "":
        return None
    if href.startswith("/"):
        target = href.lstrip("/")
    else:
        base_dir = os.path.dirname(from_file)
        target = os.path.normpath(os.path.join(base_dir, href)).replace("\\", "/")
    if target == "" or target.endswith("/"):
        target = (target + "index.html") if target else "index.html"
    return target

def check(target):
    """Return (exists, case_mismatch)."""
    if target in STATIC_ASSETS:
        real = os.path.join(ROOT, target)
        return os.path.exists(real), False
    real = os.path.join(ROOT, target)
    if os.path.exists(real):
        return True, False
    # case-insensitive fallback check (catches Windows-only-working links)
    low = target.lower()
    if low in FILES_LOWER:
        return True, True  # exists but with different case -> breaks on Linux/case-sensitive hosts
    return False, False

html_files = (
    glob.glob(os.path.join(ROOT, "*.html"))
    + glob.glob(os.path.join(ROOT, "products", "*.html"))
    + glob.glob(os.path.join(ROOT, "blog", "*.html"))
)
total_links = 0
broken = []
case_issues = []

for path in html_files:
    rel_file = os.path.relpath(path, ROOT).replace("\\", "/")
    html = io.open(path, encoding="utf-8").read()
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', html)
    for href in hrefs:
        target = resolve(href, rel_file)
        if target is None:
            continue
        total_links += 1
        exists, case_mismatch = check(target)
        if not exists:
            broken.append((rel_file, href, target))
        elif case_mismatch:
            case_issues.append((rel_file, href, target))

print(f"HTML files scanned: {len(html_files)}")
print(f"Total internal <a href> links checked: {total_links}")
print(f"\nBROKEN LINKS: {len(broken)}")
for f, href, t in broken:
    print(f"  {f}: href=\"{href}\" -> resolved to missing file \"{t}\"")
print(f"\nCASE-SENSITIVITY MISMATCHES (work on Windows, WILL 404 on GitHub/Cloudflare Pages): {len(case_issues)}")
for f, href, t in case_issues:
    print(f"  {f}: href=\"{href}\" -> \"{t}\" (real file has different case: \"{FILES_LOWER[t.lower()]}\")")

# --- JS-generated href patterns (template strings in main.js) ---
print("\n=== JS-GENERATED LINK PATTERNS (main.js) ===")
js = io.open(os.path.join(ROOT, "js", "main.js"), encoding="utf-8").read()
js_hrefs = re.findall(r'href=["\']([^"\']*\$\{[^"\']+\}[^"\']*)["\']', js)
js_hrefs += re.findall(r'href=["\'](/[a-zA-Z0-9_\-./]+\.html)["\']', js)
for h in sorted(set(js_hrefs)):
    print(" ", h)
