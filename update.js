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
    page: 'https://v.iqilu.com/live/sdtv/',
    match: 'iqilu.com/21/cb1628e9b65a4cfd985b1760809696ee'
  },
  {
    name: 'Shandong Qilu',
    page: 'https://v.iqilu.com/live/qlpd/',
    match: 'iqilu.com/291/5de861e29cdd4f9589327c8dd783172a'
  },
  {
    name: 'Hunan TV Kids',
    page: 'https://www.mgtv.com/live/',
    match: 'nn_live/nn_x64'
  },
  {
    name: 'Fujian Comprehensive CH',
    page: 'https://live.fjtv.net/zhpd/',
    match: 'live2-fuyun.fjtv.net/zhpd/hd/live'
  },
  {
    name: 'Fujian Public TV',
    page: 'https://live.fjtv.net/ggpd/',
    match: 'live2-fuyun.fjtv.net/ggxcpd/hd/live'
  },
  {
    name: 'Fujian News TV',
    page: 'https://live.fjtv.net/xwpd/',
    match: 'live1-fuyun.fjtv.net/xwpd/hd/live'
  },
  {
    name: 'Fujian Travel TV',
    page: 'https://live.fjtv.net/dspd/',
    match: 'live1-fuyun.fjtv.net/dspd/hd/live'
  },
  {
    name: 'Fujian Life TV',
    page: 'https://live.fjtv.net/jspd/',
    match: 'live2-fuyun.fjtv.net/jjpd/hd/live'
  },
  {
    name: 'Fujian Sports TV',
    page: 'https://live.fjtv.net/typd/',
    match: 'live1-fuyun.fjtv.net/typd/hd/live'
  },
  {
    name: 'Fujian Kids TV',
    page: 'https://live.fjtv.net/sepd/',
    match: 'live2-fuyun.fjtv.net/child/hd/live'
  },
  {
    name: 'Fujian Straits TV',
    page: 'https://live.fjtv.net/hxtv/',
    match: 'live1-fuyun.fjtv.net/haixiapd/hd/live'
  },
  {
    name: 'Dragon TV',
    page: 'https://www.kds.tw/tv/china-tv-channels-online/dragon-television/',
    match: 'cdn.inteltelevision.com/4987/dongfangweishi_twn/playlist'
  },
  {
    name: 'Sichuan Satellite TV',
    page: 'https://www.kds.tw/tv/china-tv-channels-online/sichuan-satellite-tv/',
    match: 'cdn.inteltelevision.com/4987/sichuan_twn/playlist'
  }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  page.setExtraHTTPHeaders({ 'Accept-Language':'en-US,en;q=0.9' });
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

    await page.goto(ch.page, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(15000);
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
