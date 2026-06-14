async function testSend() {
  const secret = '4fe17fcfe73d5035f55b9144fa10e07443659005';
  const phone = '8801604877281';
  const msg = 'Test';

  const urls = [
    `https://app.sellerscampus.com/api/send/whatsapp?secret=${secret}&account=1&phone=${phone}&type=text&message=${msg}`,
    `https://app.sellerscampus.com/api/send/whatsapp?secret=${secret}&account=z_wa_merchant_735&phone=${phone}&type=text&message=${msg}`,
    `https://app.sellerscampus.com/api/send/whatsapp?secret=${secret}&device=1&phone=${phone}&type=text&message=${msg}`,
    `https://app.sellerscampus.com/api/send/whatsapp?secret=${secret}&device=z_wa_merchant_735&phone=${phone}&type=text&message=${msg}`,
    `https://app.sellerscampus.com/api/send/whatsapp?secret=${secret}&device_id=1&phone=${phone}&type=text&message=${msg}`,
    `https://app.sellerscampus.com/api/send/whatsapp?secret=${secret}&server_id=1&phone=${phone}&type=text&message=${msg}`
  ];

  for (const url of urls) {
    const res = await fetch(url);
    const text = await res.text();
    console.log(`GET ${url}:`, text);
  }
}
testSend();
