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
    page: 'http://v.iqilu.com/live/sdtv/',
    match: 'tstreamlive302.iqilu.com/21/cb1628e9b65a4cfd985b1760809696ee'
  },
  {
    name: 'Shandong Qilu',
    page: 'https://v.iqilu.com/live/qlpd/',
    match: 'tstreamlive302.iqilu.com/291/5de861e29cdd4f9589327c8dd783172a'
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
    name: 'Shannxi Urban Youth TV',
    page: 'http://live.snrtv.com/2',
    match: 'stream.snrtv.com/sxbc-2'
  },
  {
    name: 'Shannxi News TV',
    page: 'http://live.snrtv.com/1',
    match: 'stream.snrtv.com/sxbc-1'
  },
  {
    name: 'Shannxi Silver Age CH',
    page: 'http://live.snrtv.com/3',
    match: 'stream.snrtv.com/sxbc-3'
  },
  {
    name: 'Qinqiang Channel',
    page: 'http://live.snrtv.com/5',
    match: 'stream.snrtv.com/sxbc-5'
  },
  {
    name: 'Shannxi Sports TV',
    page: 'http://live.snrtv.com/7',
    match: 'stream.snrtv.com/sxbc-7'
  },
  {
    name: 'SNRTV Agriculture',
    page: 'http://live.snrtv.com/nl',
    match: 'stream.snrtv.com/sxbc-nl'
  },
  {
    name: 'Ugo Shop TV',
    page: 'https://www.huimai.com.cn/tvList/',
    match: 'tvlive.ugoshop.com/ugotvlive/ugotv01'
  },
  {
    name: 'Macau TV',
    page: 'https://www.tdm.com.mo/zh-hant/live?Channel=1&type=tv',
    match: 'globallive.tdm.com.mo/ch1/ch1.live'
  },
  {
    name: 'Macau Infomation TV',
    page: 'https://www.tdm.com.mo/zh-hant/live?Channel=5&type=tv',
    match: 'globallive.tdm.com.mo/ch5/info_ch5.live'
  },
  {
    name: 'Macau Sports TV',
    page: 'https://www.tdm.com.mo/zh-hant/live?Channel=6&type=tv',
    match: 'globallive.tdm.com.mo/ch4/sport_ch4.live'
  },
  {
    name: 'Macau Entertainment TV',
    page: 'https://www.tdm.com.mo/zh-hant/live?Channel=7&type=tv',
    match: 'globallive.tdm.com.mo/ch6/hd_ch6.live'
  },
  {
    name: 'Ou Mun-Macau Satéllite',
    page: 'https://www.tdm.com.mo/zh-hant/live?Channel=8&type=tv',
    match: 'globallive.tdm.com.mo/ch3/ch3.live'
  },
  {
    name: 'Canal Macau',
    page: 'https://www.tdm.com.mo/zh-hant/live?Channel=2&type=tv',
    match: 'globallive.tdm.com.mo/ch2/ch2.live'
  },
  {
    name: 'Guangdong Satellite TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/43',
    match: 'tcdn.itouchtv.cn/live/gdws'
  },
  {
    name: 'Great Bay Area TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/46',
    match: 'tcdn.itouchtv.cn/live/gdgj'
  },
  {
    name: 'Lingnan Opera TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/15',
    match: 'tcdn.itouchtv.cn/live/lnxq'
  },
  {
    name: 'GRTN Cultural TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/75',
    match: 'lbplay.grtn.cn/live/wenhua'
  },
  {
    name: 'Guangdong Pearl River TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/44',
    match: 'tcdn.itouchtv.cn/live/gdzj'
  },
  {
    name: 'Guangdong Film TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/53',
    match: 'tcdn.itouchtv.cn/live/gdys'
  },
  {
    name: 'Guangdong Mobile TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/74',
    match: 'tcdn.itouchtv.cn/live/ydpd'
  },
  {
    name: 'GRTN Life TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/102',
    match: 'tcdn.itouchtv.cn/live/life'
  },
  {
    name: 'GRTN News TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/45',
    match: 'tcdn.itouchtv.cn/live/xwpd'
  },
  {
    name: 'GRTN 4K TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/16',
    match: 'tcdn.itouchtv.cn/live/gdzy'
  },
  {
    name: 'Guangdong Education TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/111',
    match: 'tcdn.itouchtv.cn/live/xdjy'
  },
  {
    name: 'Guangdong People TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/48',
    match: 'tcdn.itouchtv.cn/live/gdgg'
  },
  {
    name: 'Guangdong Children TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/54',
    match: 'tcdn.itouchtv.cn/live/gdse'
  },
  {
    name: 'Guangdong Drama Classic TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/100',
    match: 'tcdn.itouchtv.cn/live/lizhi'
  },
  {
    name: 'Guangdong Sports TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/47',
    match: 'tcdn.itouchtv.cn/live/gdty'
  },
  {
    name: 'Guangdong Shopping TV',
    page: 'https://www.gdtv.cn/tvChannelDetail/42',
    match: 'tcdn.itouchtv.cn/live/nfgw'
  },
  {
    name: 'Henan Satellite TV',
    page: 'https://static.hntv.tv/kds/#/',
    match: 'tvcdn.stream3.hndt.com/tv'
  },
  {
    name: 'Chenzhou TV',
    page: 'https://www.ngcz.tv/folder83/folder86',
    match: 'live.ngcz.tv/aczxw/20221028/live'
  },
  {
    name: 'Nanchang News TV',
    page: 'https://www.nctv.net.cn/live?channel=4',
    match: 'live.nctv.net.cn/live/nctv1'
  },
  {
    name: 'Hainan News TV',
    page: 'https://www.hnntv.cn/live.html?playType=livePlay&channelId=3&referPage=home',
    match: 'live2.hnntv.cn/srs/tv/xwpd'
  },
  {
    name: 'Hainan Travel TV',
    page: 'https://www.hnntv.cn/live.html?playType=livePlay&channelId=6&referPage=home',
    match: 'live2.hnntv.cn/srs/tv/wlpd'
  },
  {
    name: 'Hainan Satellite TV',
    page: 'https://www.hnntv.cn/live.html?playType=livePlay&channelId=13&referPage=home',
    match: 'live2.hnntv.cn/srs/tv/lywsgq'
  },
  {
    name: 'Sansha Satellite TV',
    page: 'https://www.hnntv.cn/live.html?playType=livePlay&channelId=5&referPage=home',
    match: 'livessws.hnntv.cn/live/ssws'
  },
  {
    name: 'Hainan Public TV',
    page: 'https://www.hnntv.cn/live.html?playType=livePlay&channelId=4&referPage=home',
    match: 'live2.hnntv.cn/srs/tv/ggpd'
  },
  {
    name: 'Hainan Children TV',
    page: 'https://www.hnntv.cn/live.html?playType=livePlay&channelId=7&referPage=home',
    match: 'live2.hnntv.cn/srs/tv/sepd'
  },
  {
    name: 'Harbin News TV',
    page: 'https://www.hrbtv.net/folder79/folder81/',
    match: 'stream.hrbtv.net/xwzh'
  },
  {
    name: 'Harbin Life TV',
    page: 'https://www.hrbtv.net/folder79/folder85/',
    match: 'stream.hrbtv.net/shpd'
  },
  {
    name: 'Harbin Movie TV',
    page: 'https://www.hrbtv.net/folder79/folder87/',
    match: 'stream.hrbtv.net/yspd'
  },
  {
    name: 'Huaian Public TV',
    page: 'https://glive.habctv.com/tv/808?uin=1610',
    match: 'live.hlsplay.aodianyun.com/tv_radio'
  },
  {
    name: 'Yancheng TV1',
    page: 'https://www.0515yc.cn/folder147/folder148/folder156/folder245/',
    match: 'live1yc.0515yc.cn/sd/sd/live'
  },
  {
    name: 'Shandong Sports TV',
    page: 'https://v.iqilu.com/live/typd/',
    match: 'tstreamlive302.iqilu.com/291/d9c0aba79a944b41a7f4f1ac422d9808'
  },
  {
    name: 'Shandong Life TV',
    page: 'https://v.iqilu.com/live/shpd/',
    match: 'tstreamlive302.iqilu.com/291/6e9efb8f95a543db8246f1cf06ba960b'
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

    try {
  await page.goto(ch.page, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(15000);
} catch (e) {
  console.log(`Skip ${ch.name} (page timeout)`);
  continue;
}
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
