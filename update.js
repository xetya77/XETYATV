import { chromium } from 'playwright';
import fs from 'fs';

const FILE = '@xetyatv.m3u';

const channels = [
  {
    name: 'Shannxi Satellite TV',
    page: 'http://live.snrtv.com/star',
    match: 'sxbc-star'
  },
  {
    name: 'Shandong Satellite TV',
    page: 'https://v.iqilu.com/',
    match: 'playlist.m3u8'
  },
   {
    name: 'Shandong Qilu',
    page: 'https://v.iqilu.com/live/qlpd/',
    match: 'playlist.m3u8'
  }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let autoContent = '';

  for (const ch of channels) {
    let found = null;

    page.removeAllListeners('request');
    page.on('request', r => {
      const url = r.url();
      if (url.includes('.m3u8') && url.includes(ch.match)) {
        found = url;
      }
    });

    await page.goto(ch.page, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    if (found) {
      autoContent += `#EXTINF:-1,${ch.name}\n${found}\n\n`;
    }
  }

  await browser.close();

  let text = fs.readFileSync(FILE, 'utf8');

  const start = '#AUTO_UPDATE_START';
  const end = '#AUTO_UPDATE_END';

  const regex = new RegExp(`${start}[\\s\\S]*?${end}`, 'm');

  const replacement = `${start}\n${autoContent}${end}`;

  text = text.replace(regex, replacement);

  fs.writeFileSync(FILE, text);
})();
