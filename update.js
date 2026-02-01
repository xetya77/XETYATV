import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let m3u8Url = null;

  page.on('request', req => {
    const url = req.url();
    if (
      url.includes('.m3u8') &&
      url.includes('stream.snrtv.com') &&
      url.includes('sxbc-star')
    ) {
      m3u8Url = url;
    }
  });

  // GANTI URL INI DENGAN WEBSITE ASLI TEMPAT STREAM DIMUAT
  await page.goto('http://live.snrtv.com/star', {
    waitUntil: 'networkidle'
  });

  await page.waitForTimeout(5000);

  if (!m3u8Url) {
    console.log('M3U8 tidak ditemukan');
    process.exit(1);
  }

  const playlist = `#EXTM3U
#EXTINF:-1,Shandong Satelit TV
${m3u8Url}
`;

  fs.writeFileSync('playlist.m3u', playlist);
  await browser.close();
})();
  
