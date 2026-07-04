// Usage: node screenshot.mjs <url> [label]
// Saves full-page screenshots to ./temporary screenshots/screenshot-N[-label].png
import puppeteer from 'puppeteer';
import { mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

const url = process.argv[2];
const label = process.argv[3];
if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label]');
  process.exit(1);
}

const dir = path.join(import.meta.dirname, 'temporary screenshots');
mkdirSync(dir, { recursive: true });

const nums = readdirSync(dir)
  .map((f) => f.match(/^screenshot-(\d+)/))
  .filter(Boolean)
  .map((m) => Number(m[1]));
const n = nums.length ? Math.max(...nums) + 1 : 1;
const file = path.join(dir, `screenshot-${n}${label ? `-${label}` : ''}.png`);

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500)); // let hydration + entrance animations settle

// Scroll through the page in steps so IntersectionObserver-driven reveals fire,
// then return to top before capturing.
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 250));
  }
  window.scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: file, fullPage: true });
await browser.close();
console.log(file);
