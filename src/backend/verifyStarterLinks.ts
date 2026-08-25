async function checkLinks() {
  const links = [
    { name: 'Cash App', url: 'https://cash.app/app/MONEYPLUGS' },
    { name: 'Upside', url: 'https://upside.app.link/MONEYPLUGS' },
    { name: 'Fetch', url: 'https://fetchrewards.onelink.me/MONEYPLUGS' },
    { name: 'Webull', url: 'https://a.webull.com/MONEYPLUGS' },
    { name: 'Robinhood', url: 'https://join.robinhood.com/MONEYPLUGS' },
  ];

  console.log('🔍 Testing Starter Set destination links for live reachability...\n');

  for (const item of links) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(item.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: controller.signal,
        redirect: 'follow'
      });
      clearTimeout(timeout);
      const latency = Date.now() - start;
      console.log(`✅ ${item.name.padEnd(12)}: HTTP ${res.status} ${res.statusText} (${latency}ms) -> ${res.url}`);
    } catch (e: any) {
      console.log(`⚠️ ${item.name.padEnd(12)}: ${e.message}`);
    }
  }
}

checkLinks();
