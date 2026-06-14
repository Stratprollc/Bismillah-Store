async function testSend() {
  const secret = '4fe17fcfe73d5035f55b9144fa10e07443659005';
  const phone = '8801604877281';
  const msg = 'Test message with invoice link https://example.com/invoice';

  const urls = [
    `https://app.sellerscampus.com/api/send/whatsapp?secret=${secret}&account=1&phone=${phone}&type=text&message=${encodeURIComponent(msg)}`,
    `https://app.sellerscampus.com/api/send/whatsapp?token=${secret}&phone=${phone}&type=text&message=${encodeURIComponent(msg)}`,
    `https://app.sellerscampus.com/api/create/message?secret=${secret}&phone=${phone}&message=${encodeURIComponent(msg)}`,
    `https://app.sellerscampus.com/api/v1/whatsapp/send`,
    `https://app.sellerscampus.com/api/v1/send/whatsapp`
  ];

  for (const url of urls) {
    try {
      if (url.includes('api/v1')) {
        const res = await fetch(url, {
          method: 'POST',
          headers: {'Authorization': `Bearer ${secret}`, 'Content-Type': 'application/json'},
          body: JSON.stringify({phone, message: msg})
        });
        console.log(`POST ${url}:`, await res.text());
      } else {
        const res = await fetch(url);
        console.log(`GET ${url}:`, await res.text());
      }
    } catch (e) {
      console.log(`Error ${url}:`, e.message);
    }
  }
}
testSend();
