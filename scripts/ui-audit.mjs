#!/usr/bin/env node
// ui-audit: what a judge meets before reading a word. It checks the link preview, the HTML
// that a fetch without JavaScript receives (AI judges, crawlers, link unfurlers), and the
// first screen at 1440 and 375 wide.
//
// It uses the project's Playwright if the current folder has one, otherwise the copy inside the
// global Playwright CLI (npm i -g @playwright/cli), and falls back to the installed Google Chrome
// when Playwright's own browser build is missing. Nothing has to be installed per project.
//   node ui-audit.mjs <url> [--phrase "words from the thesis"] [--signature "<selector>"] [--header "name: value"] [--out <dir>]
//
// --signature times how long the signature component takes to appear, e.g. "text=DEPARTED" or "[data-signature]".
// It prints PASS, WARN and FAIL lines, saves desktop, phone and no-JS screenshots, and exits 1 on any FAIL.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const url = args.find((a) => /^https?:\/\//.test(a));
if (!url) {
  console.error('usage: node ui-audit.mjs <url> [--phrase "words from the thesis"] [--signature "<selector>"] [--out <dir>]');
  process.exit(2);
}
const phrase = opt("phrase");
const signature = opt("signature");
// --header "name: value", repeatable: e.g. Vercel's x-vercel-protection-bypass for protected previews.
const headers = Object.fromEntries(
  args.flatMap((a, i) => (a === "--header" && args[i + 1] ? [args[i + 1]] : []))
    .map((h) => [h.slice(0, h.indexOf(":")).trim(), h.slice(h.indexOf(":") + 1).trim()])
    .filter(([k]) => k),
);
const out = opt("out") ?? path.join("internal", "design", "audit", new Date().toISOString().slice(0, 10));

function loadPlaywright() {
  const places = [["this project", path.join(process.cwd(), "noop.js")]];
  try {
    const root = execSync("npm root -g", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    for (const host of ["@playwright/cli", "@playwright/mcp", "@playwright/test", "playwright"]) {
      places.push([`global ${host}`, path.join(root, host, "package.json")]);
    }
  } catch {}
  for (const [label, from] of places) {
    for (const lib of ["playwright", "playwright-core"]) {
      try {
        const req = createRequire(from);
        const mod = req(lib);
        if (mod?.chromium) return { chromium: mod.chromium, source: `${lib} ${req(`${lib}/package.json`).version} (${label})` };
      } catch {}
    }
  }
  return null;
}
const pw = loadPlaywright();
if (!pw) {
  console.error("No Playwright in this folder or installed globally. Install the CLI once: npm i -g @playwright/cli");
  process.exit(2);
}
const { chromium } = pw;
fs.mkdirSync(out, { recursive: true });

const results = [];
const report = (level, check, detail) => results.push({ level, check, detail: String(detail) });

// 1. The HTML a fetch receives. AI judges, X, Discord and Telegram previews, and crawlers stop here.
const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (compatible; ui-audit)", ...headers } });
const html = await res.text();
const headEnd = html.search(/<\/head>/i);
const head = headEnd > 0 ? html.slice(0, headEnd) : html.slice(0, 30000);
const meta = {};
for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
  const a = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) a[m[1].toLowerCase()] = m[3] ?? m[4];
  const key = (a.property ?? a.name)?.toLowerCase();
  if (key && a.content != null) meta[key] = a.content;
}
const title = head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
const body = html.replace(/<head[\s\S]*?<\/head>/i, " ").replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " ");
// Decode entities (server-rendered React writes ' as &#x27;) and treat curly and straight quotes alike.
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (_, e) => {
  if (e[0] === "#") {
    const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
  }
  return {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘",
    rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", hellip: "…",
  }[e.toLowerCase()] ?? " ";
});
const plainQuotes = (s) => s.replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"');
const text = plainQuotes(decode(body.replace(/<[^>]+>/g, " "))).replace(/\s+/g, " ").trim();
const words = text ? text.split(" ").length : 0;
const h1 = body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

report(res.ok ? "PASS" : "FAIL", "Responds", `${res.status} ${res.url}`);
report(words >= 50 ? "PASS" : "FAIL", "Readable without JavaScript", `${words} words${h1 ? `, h1 "${h1.slice(0, 70)}"` : ", no h1"}`);
if (phrase) report(text.toLowerCase().includes(plainQuotes(phrase).toLowerCase()) ? "PASS" : "FAIL", "Thesis in the HTML", `"${phrase}"`);
report(title ? "PASS" : "FAIL", "Title", title ?? "missing");
report(meta.description ? "PASS" : "WARN", "Description", meta.description?.slice(0, 90) ?? "missing");
report(meta.viewport ? "PASS" : "FAIL", "Viewport tag", meta.viewport ?? "missing, so phones render the desktop layout zoomed out");
report(/<html\b[^>]*\blang=/i.test(html) ? "PASS" : "WARN", "Page language", /<html\b[^>]*\blang=/i.test(html) ? "set" : "no lang on <html>");
if (meta["og:image"]) {
  const img = await fetch(new URL(meta["og:image"], res.url), { headers }).catch(() => null);
  const type = img?.headers.get("content-type") ?? "";
  report(img?.ok && type.startsWith("image/") ? "PASS" : "FAIL", "Link preview image", `${img?.status ?? "unreachable"} ${type} ${meta["og:image"]}`);
  if (!/^https?:\/\//.test(meta["og:image"])) report("WARN", "Link preview image URL", "relative; some unfurlers need an absolute URL");
} else {
  report("FAIL", "Link preview image", "no og:image, so the link posts as bare text");
}
report(meta["twitter:card"] === "summary_large_image" ? "PASS" : "WARN", "Large card on X", meta["twitter:card"] ?? "no twitter:card");
const hasIcon = /<link\b[^>]*rel=["'][^"']*icon/i.test(head) || (await fetch(new URL("/favicon.ico", res.url), { headers }).then((r) => r.ok).catch(() => false));
report(hasIcon ? "PASS" : "FAIL", "Favicon", hasIcon ? "present" : "missing, so the tab shows the browser's blank icon");

// 2. The first screen, rendered, at desktop and phone width.
let browser;
let browserName = "Playwright's Chromium";
try {
  browser = await chromium.launch();
} catch (first) {
  // Playwright's own browser build isn't downloaded for this version: use the installed Google Chrome.
  browser = await chromium.launch({ channel: "chrome" }).catch(() => { throw first; });
  browserName = "Google Chrome";
}
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
for (const vp of [{ tag: "desktop", width: 1440, height: 900 }, { tag: "phone", width: 375, height: 812, mobile: true }]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: !!vp.mobile,
    hasTouch: !!vp.mobile,
    ...(vp.mobile ? { userAgent: IPHONE } : {}),
    extraHTTPHeaders: headers,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 120)));
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));
  page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url().slice(0, 100)}`));
  page.on("requestfailed", (r) => {
    const why = r.failure()?.errorText ?? "failed";
    if (!why.includes("ERR_ABORTED")) errors.push(`${why} ${r.url().slice(0, 100)}`); // aborted prefetches aren't errors
  });
  await page.addInitScript(() => {
    window.__lcp = 0;
    window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  });
  const t0 = Date.now();
  try {
    await page.goto(url, { waitUntil: "load", timeout: 45000 });
  } catch (e) {
    report("FAIL", `${vp.tag}: loads`, String(e).slice(0, 120));
  }
  if (signature) {
    const seen = await page.waitForSelector(signature, { state: "visible", timeout: 20000 }).then(() => Date.now() - t0).catch(() => null);
    report(seen == null ? "FAIL" : seen > 4000 ? "FAIL" : seen > 2500 ? "WARN" : "PASS", `${vp.tag}: signature component visible`,
      seen == null ? `not visible after 20 s (${signature})` : `${seen} ms after navigation, unthrottled`);
  }
  await page.waitForTimeout(4000); // let entrance animations settle
  const m = await page.evaluate(() => {
    const shown = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const textEls = [...document.querySelectorAll("body *")].filter(
      (e) => shown(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1),
    );
    return {
      scrollY: Math.round(window.scrollY),
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      cls: +window.__cls.toFixed(3),
      lcp: Math.round(window.__lcp),
      tiny: textEls.filter((e) => e.getBoundingClientRect().top < innerHeight && parseFloat(getComputedStyle(e).fontSize) < 12).length,
      unnamed: [...document.querySelectorAll("button, a[href], [role=button]")].filter(
        (b) => shown(b) && !(b.innerText.trim() || b.getAttribute("aria-label") || b.getAttribute("aria-labelledby") || b.getAttribute("title") || b.querySelector("img[alt]:not([alt=''])")),
      ).length,
    };
  });
  await page.screenshot({ path: path.join(out, `${vp.tag}.png`) });
  report(m.scrollY > 0 ? "FAIL" : "PASS", `${vp.tag}: page stays at the top`,
    m.scrollY > 0 ? `scrolled itself ${m.scrollY}px down, so the first screen isn't the top (often scrollIntoView in a mount effect)` : "yes");
  report(m.overflowX > 0 ? "FAIL" : "PASS", `${vp.tag}: sideways scroll`, `${m.overflowX}px`);
  report(m.cls > 0.1 ? "FAIL" : m.cls > 0.05 ? "WARN" : "PASS", `${vp.tag}: layout shift`, `CLS ${m.cls}`);
  report(m.lcp > 2500 ? "WARN" : "PASS", `${vp.tag}: largest paint`, `${m.lcp} ms, unthrottled`);
  report(errors.length ? "FAIL" : "PASS", `${vp.tag}: console and network`, errors.length ? errors.slice(0, 3).join(" | ") : "clean");
  report(m.unnamed ? "FAIL" : "PASS", `${vp.tag}: controls with no name`, m.unnamed);
  report(m.tiny ? "WARN" : "PASS", `${vp.tag}: text under 12px on the first screen`, m.tiny);
  await ctx.close();
}

// 3. The same page with JavaScript off, saved for a look.
const nojs = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false, extraHTTPHeaders: headers });
const np = await nojs.newPage();
await np.goto(url, { waitUntil: "load", timeout: 30000 }).catch(() => {});
await np.screenshot({ path: path.join(out, "nojs.png") }).catch(() => {});
const engine = `${pw.source}, ${browserName} ${browser.version()}`;
await browser.close();

const width = Math.max(...results.map((r) => r.check.length));
for (const r of results) console.log(`${r.level.padEnd(4)}  ${r.check.padEnd(width)}  ${r.detail}`);
console.log(`\nScreenshots: ${path.join(out, "desktop.png")}, phone.png, nojs.png`);
console.log(`Browser: ${engine}`);
process.exit(results.some((r) => r.level === "FAIL") ? 1 : 0);
