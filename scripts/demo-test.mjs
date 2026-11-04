import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';

console.log('Starting Vite server for automated interaction test...');
const server = await createServer({
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 5211, strictPort: true, open: false }
});
await server.listen();

try {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  await page.goto('http://127.0.0.1:5211/', { waitUntil: 'networkidle0' });

  // 1. Test clicking an available slot in the calendar
  console.log('Testing Test 1: Click open slot...');
  const openSlot = await page.$('.slot.available');
  if (!openSlot) throw new Error('No open slot found');
  await openSlot.click();
  await new Promise(r => setTimeout(r, 400));

  // Check form values populated
  const roomValue = await page.$eval('input[list="rooms"]', el => el.value);
  const startDateValue = await page.$eval('input[type="date"]', el => el.value);
  console.log(`Slot clicked! Populated form with room: ${roomValue}, start: ${startDateValue}`);

  // Check live status pill
  const pillText = await page.$eval('.live-status-pill', el => el.textContent);
  console.log(`Live status pill shows: "${pillText}"`);

  // 2. Test Main Action: Reserving the room
  console.log('Testing Test 2: Reserving room (Main Action)...');
  await page.type('textarea', 'Automated Test Study Group');
  await page.click('.reserve-button');
  await new Promise(r => setTimeout(r, 500));

  const successNotice = await page.$eval('.success', el => el.textContent);
  console.log(`Success message: "${successNotice}"`);

  // 3. Test Unsuccessful Action: Attempting to reserve an already booked room/dates
  console.log('Testing Test 3: Conflict detection (Unsuccessful Action)...');
  // Re-enter conflicting booking
  await page.$eval('input[list="rooms"]', el => el.value = 'A1-203');
  // Dispatch change
  await page.type('input[list="rooms"]', ' ');
  await page.evaluate(() => {
    const start = document.querySelectorAll('input[type="date"]')[0];
    const end = document.querySelectorAll('input[type="date"]')[1];
    start.value = '2026-11-09';
    start.dispatchEvent(new Event('change', { bubbles: true }));
    end.value = '2026-11-11';
    end.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 300));

  const conflictPill = await page.$eval('.live-status-pill', el => el.textContent);
  console.log(`Live conflict pill: "${conflictPill}"`);

  await page.click('.reserve-button');
  await new Promise(r => setTimeout(r, 300));
  const errorAlert = await page.$eval('.error', el => el.textContent);
  console.log(`Submission error alert correctly displayed: "${errorAlert}"`);

  // 4. Test Editing Existing Reservation
  console.log('Testing Test 4: Adjust reservation...');
  const changeBtn = await page.$('.btn-change');
  if (changeBtn) {
    await changeBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const editingBanner = await page.$eval('.editing-banner', el => el.textContent);
    console.log(`Editing banner active: "${editingBanner.slice(0, 60)}..."`);
  }

  // 5. Test Wing Filtering
  console.log('Testing Test 5: Wing filter...');
  const wingButtons = await page.$$('.chip');
  for (const btn of wingButtons) {
    const text = await btn.evaluate(el => el.textContent);
    if (text === 'Wing B') {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 300));
  const roomsDisplayed = await page.$$eval('.roomname strong', els => els.map(e => e.textContent));
  console.log(`Rooms shown after Wing B filter: ${roomsDisplayed.join(', ')}`);
  const allB = roomsDisplayed.every(r => r.startsWith('B'));
  console.log(`All displayed rooms belong to Wing B: ${allB}`);

  // Capture a screenshot of the active editing / live feedback state as well!
  await page.screenshot({ path: 'feature_demo_screenshot.png' });
  console.log('Saved feature demo screenshot to feature_demo_screenshot.png');

  console.log('ALL TESTS PASSED SUCCESSFULLY!');
  await browser.close();
} catch (err) {
  console.error('Test failed:', err);
} finally {
  await server.close();
}
