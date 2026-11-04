import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';
import path from 'path';

const filename = process.argv[2] || 'before_screenshot.png';
const outPath = path.resolve(process.cwd(), filename);

console.log('Starting Vite server...');
const server = await createServer({
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 5199, strictPort: true, open: false }
});
await server.listen();
console.log('Vite server running at http://127.0.0.1:5199/');

try {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:5199/', { waitUntil: 'networkidle0' });

  // Optional: wait an extra 500ms for CSS/fonts
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: outPath, fullPage: false });
  console.log('Screenshot saved to', outPath);

  await browser.close();
} catch (err) {
  console.error('Puppeteer error:', err);
} finally {
  await server.close();
  console.log('Server stopped.');
}

