import fetch from 'node-fetch';
async function run() {
  const secret = '4fe17fcfe73d5035f55b9144fa10e07443659005';
  
  const endpoints = [
     'https://app.sellerscampus.com/api/get/devices',
     'https://app.sellerscampus.com/api/get/whatsapp',
     'https://app.sellerscampus.com/api/v1/whatsapp',
     'https://app.sellerscampus.com/api/v1/devices',
  ];
  
  for (const url of endpoints) {
     const res = await fetch(url + '?secret=' + secret);
     console.log('[GET]', url, res.status, (await res.text()).substring(0, 50));
  }
}
run();
