import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const extensionDir = join(root, "extension");
const outputDir = join(root, "docs", "screenshots");
await mkdir(outputDir, { recursive: true });
const messages = JSON.parse(await readFile(join(extensionDir, "_locales/en/messages.json"), "utf8"));
const manifest = JSON.parse(await readFile(join(extensionDir, "manifest.json"), "utf8"));
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  execFileSync("bash", [join(root, "scripts/prepare-playwright-browser.sh")], { encoding: "utf8" }).trim();

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"]
]);

const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, "http://127.0.0.1").pathname;
    const relative = pathname === "/" ? "popup.html" : pathname.slice(1);
    const file = resolve(extensionDir, relative);
    if (!file.startsWith(extensionDir)) throw new Error("invalid path");
    const data = await readFile(file);
    res.writeHead(200, { "content-type": mime.get(extname(file)) || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404).end("not found");
  }
});

await new Promise((resolveReady) => server.listen(0, "127.0.0.1", resolveReady));
const { port } = server.address();
const libraryPath = join(root, ".cache", "browser-libs", "root", "usr", "lib", "x86_64-linux-gnu");
const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: ["--no-sandbox"],
  env: {
    ...process.env,
    LD_LIBRARY_PATH: [libraryPath, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":")
  }
});

async function openPopup({ active = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.addInitScript(({ localeMessages, activeTimer, hostVersion }) => {
    const fixedNow = 1_800_000_000_000;
    Date.now = () => fixedNow;
    const getMessage = (key, substitutions = []) => {
      let text = localeMessages[key]?.message || key;
      const values = Array.isArray(substitutions) ? substitutions : [substitutions];
      const placeholders = localeMessages[key]?.placeholders || {};
      for (const [name, spec] of Object.entries(placeholders)) {
        const match = /^\$(\d+)$/.exec(spec.content || "");
        if (match) text = text.replaceAll(`$${name.toUpperCase()}$`, values[Number(match[1]) - 1] || "");
      }
      return text;
    };
    globalThis.chrome = {
      i18n: { getUILanguage: () => "en-US", getMessage },
      runtime: {
        sendMessage: async (message) => {
          if (message?.type === "ping-native") return { ok: true, version: hostVersion };
          if (message?.type === "status") {
            return { ok: true, state: activeTimer ? {
              active: true,
              action: "sleep",
              targetTime: Date.now() + 22 * 60_000,
              durationMinutes: 30,
              lastError: null,
              startedAt: Date.now() - 8 * 60_000
            } : null };
          }
          return { ok: true, state: null };
        }
      }
    };
  }, { localeMessages: messages, activeTimer: active, hostVersion: manifest.version });
  await page.goto(`http://127.0.0.1:${port}/popup.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector("#hostText")?.textContent.includes("connected"));
  return { context, page };
}

async function captureReadme(name, active) {
  const { context, page } = await openPopup({ active });
  await page.locator(".panel").screenshot({ path: join(outputDir, `${name}.png`), scale: "css" });
  await context.close();
}
async function captureStore(name, active) {
  const { context, page } = await openPopup({ active });
  await page.addStyleTag({ content: `
    html { min-height: 100%; background: radial-gradient(circle at 50% 18%, #1d2f49 0, #0f1724 48%, #09111d 100%); }
    body { width: 100%; min-height: 100vh; display: grid; place-items: center; background: transparent; }
    .panel { width: 380px; border: 1px solid #2f415a; border-radius: 16px; background: #0f1724; box-shadow: 0 28px 80px rgba(0,0,0,.45); }
  ` });
  await page.screenshot({ path: join(outputDir, `${name}.png`), fullPage: false });
  await context.close();
}

try {
  await captureReadme("popup-idle", false);
  await captureReadme("popup-running", true);
  await captureStore("store-idle-1280x800", false);
  await captureStore("store-running-1280x800", true);
  console.log(`Screenshots written to ${outputDir}`);
} finally {
  await browser.close();
  await new Promise((resolveDone) => server.close(resolveDone));
}
