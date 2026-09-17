import { execFileSync } from "node:child_process";
import { mkdir, copyFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const iconDir = join(root, "extension", "icons");
const storeDir = join(root, "docs", "store-assets");
await mkdir(iconDir, { recursive: true });
await mkdir(storeDir, { recursive: true });

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  execFileSync("bash", [join(root, "scripts/prepare-playwright-browser.sh")], { encoding: "utf8" }).trim();
const libraryPath = join(root, ".cache", "browser-libs", "root", "usr", "lib", "x86_64-linux-gnu");
const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: ["--no-sandbox"],
  env: { ...process.env, LD_LIBRARY_PATH: [libraryPath, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":") }
});

const brandMark = `
<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1f3553"/><stop offset="1" stop-color="#0f1724"/></linearGradient></defs>
  <rect x="16" y="16" width="96" height="96" rx="25" fill="url(#bg)" stroke="#405a7b" stroke-width="2"/>
  <path d="M64 37a29 29 0 1 1-20.5 8.5" fill="none" stroke="#82aaff" stroke-width="8" stroke-linecap="round"/>
  <path d="M64 29v28" fill="none" stroke="#62c28a" stroke-width="9" stroke-linecap="round"/>
  <path d="M64 67l16 10" fill="none" stroke="#eef4ff" stroke-width="6" stroke-linecap="round"/>
  <circle cx="64" cy="67" r="5" fill="#eef4ff"/>
</svg>`;
async function renderIcon(size) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${brandMark}`);
  await page.screenshot({ path: join(iconDir, `icon${size}.png`), omitBackground: true });
  await page.close();
}

function promoHtml(width, height) {
  const cardWidth = Math.round(width * 0.39);
  const cardHeight = Math.round(height * 0.62);
  const iconSize = Math.round(Math.min(width, height) * 0.58);
  return `<!doctype html><html><style>
    *{box-sizing:border-box}html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden}
    body{display:grid;grid-template-columns:46% 54%;align-items:center;background:radial-gradient(circle at 18% 20%,#294a73 0,#13243a 36%,#0b1422 76%);font-family:Arial,sans-serif}
    .mark{width:${iconSize}px;height:${iconSize}px;justify-self:center;filter:drop-shadow(0 20px 28px rgba(0,0,0,.35))}
    .card{width:${cardWidth}px;height:${cardHeight}px;justify-self:center;border:2px solid #405a7b;border-radius:${Math.max(16, Math.round(height*.055))}px;background:#0f1724;padding:${Math.max(14, Math.round(height*.055))}px;box-shadow:0 26px 50px rgba(0,0,0,.42)}
    .numbers{display:grid;grid-template-columns:1fr 1fr;gap:${Math.max(8, Math.round(width*.018))}px}
    .box{height:${Math.max(30, Math.round(height*.19))}px;border:1px solid #39516f;border-radius:12px;background:#1c293c}
    .presets{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:${Math.max(8, Math.round(height*.035))}px}
    .pill{height:${Math.max(12, Math.round(height*.065))}px;border:1px solid #39516f;border-radius:8px;background:#19263a}
    .action{margin-top:${Math.max(10, Math.round(height*.045))}px;height:${Math.max(38, Math.round(height*.18))}px;border:1px solid #334b68;border-radius:12px;display:flex;align-items:center;padding:0 12%;gap:10%;background:#101b2b}
    .radio{width:${Math.max(9, Math.round(height*.04))}px;height:${Math.max(9, Math.round(height*.04))}px;border-radius:50%;background:#62c28a;box-shadow:0 0 0 3px #244b39}
    .lines{flex:1;display:grid;gap:${Math.max(4, Math.round(height*.018))}px}.line{height:${Math.max(5, Math.round(height*.02))}px;border-radius:99px;background:#82aaff}.line.short{width:62%;opacity:.55}
    .button{margin-top:${Math.max(10, Math.round(height*.04))}px;height:${Math.max(24, Math.round(height*.12))}px;border-radius:10px;background:#62c28a}
  </style><body><div class="mark">${brandMark}</div><div class="card"><div class="numbers"><div class="box"></div><div class="box"></div></div><div class="presets"><div class="pill"></div><div class="pill"></div><div class="pill"></div><div class="pill"></div></div><div class="action"><div class="radio"></div><div class="lines"><div class="line"></div><div class="line short"></div></div></div><div class="button"></div></div></body></html>`;
}
async function renderPromo(name, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(promoHtml(width, height), { waitUntil: "load" });
  await page.screenshot({ path: join(storeDir, name) });
  await page.close();
}

try {
  for (const size of [16, 32, 48, 128]) await renderIcon(size);
  await copyFile(join(iconDir, "icon128.png"), join(storeDir, "icon-128.png"));
  await renderPromo("promo-small-440x280.png", 440, 280);
  await renderPromo("promo-marquee-1400x560.png", 1400, 560);
  console.log(`Extension icons written to ${iconDir}`);
  console.log(`Store assets written to ${storeDir}`);
} finally {
  await browser.close();
}
