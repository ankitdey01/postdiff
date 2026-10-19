// Local visual-verification helper (dev only, never shipped).
// Scrolls the landing step by step so IntersectionObserver reveals fire,
// then captures per-section viewport shots plus a final full-page shot.
// Usage: node scripts/shot.mjs [port] [outdir]
import { chromium } from "playwright-core";

const port = process.argv[2] ?? "3113";
const outdir = process.argv[3] ?? "C:/Users/ankit/AppData/Local/Temp/opencode";
const base = `http://localhost:${port}/`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: "networkidle" });

const height = await page.evaluate(() => document.body.scrollHeight);
const steps = Math.ceil(height / 900);
for (let i = 0; i < steps; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * 900);
  await page.waitForTimeout(650);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);

// Per-section shots at each section's top.
const ids = ["stories", "problem", "solution", "platforms", "features", "proof", "faq", "start"];
for (const id of ids) {
  const el = page.locator(`#${id}`);
  if ((await el.count()) > 0) {
    await el.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
    await page.screenshot({ path: `${outdir}/pd-sec-${id}.png` });
  }
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: `${outdir}/pd-hero-1440.png` });
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${outdir}/pd-hero-390.png`, fullPage: false });
await browser.close();
console.log("shots done:", outdir);
