async function test() {
  const secret = '4fe17fcfe73d5035f55b9144fa10e07443659005';
  
  const urls = [
    `https://app.sellerscampus.com/api/v1/whatsapp/device`,
    `https://app.sellerscampus.com/api/v1/whatsapp/accounts`,
    `https://app.sellerscampus.com/api/get/whatsapp?secret=${secret}`,
    `https://app.sellerscampus.com/api/get/accounts?secret=${secret}`,
    `https://app.sellerscampus.com/api/get/devices?secret=${secret}`,
    `https://app.sellerscampus.com/api/get/wa.device?secret=${secret}`
  ];

  for(const url of urls) {
    try {
      const res = await fetch(url);
      console.log(`GET ${url}`, await res.text());
    } catch(e) {}
  }
}
test();
